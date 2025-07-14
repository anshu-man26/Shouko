const jwt= require('jsonwebtoken');
const {comparePassword, hashPassword}= require("../helpers/auth")
const { User, Case, Clue, Person } = require("../models");

const test=(req,res)=>{
    console.log('Test endpoint hit');
    res.json({message: "test is working", timestamp: new Date().toISOString()})
}

const registerUser=async (req,res)=>{
   try {
    const{name,email,password}=req.body;
    if(!name){
        return res.json({
            error:'name is required'
        })
    };
    if(!email){
      return res.json({
          error:'email is required'
      })
  };
    if(!password || password.length<6){
        return res.json({
            error: "Password is required and should be atleast 6 characters long"
        })
    }

    // Check if user already exists
    const exist = await User.findOne({ where: { email } });
    if (exist) {
        return res.json({
        error: "Email is already in Use"
      });
     }
    
    // Create new user (password will be hashed by the model hook)
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Return user without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    
    return res.json(userResponse);
   } catch (error) {
    console.log('registerUser error:', error);
    res.status(500).json({ error: 'Internal server error' });
   }
}

const loginUser=async (req,res)=>{
   try {
    const {email,password}=req.body;
    if(!email){
      return res.json({
        error: "provide email"
    })
    }
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.json({
            error: "No User Found"
      });
    }

    // Compare password using the model method
    const match = await user.comparePassword(password);
    if (!match) {
      return res.json({ error: "password do not match" });
    }

    // If password matches, create JWT and send response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    jwt.sign(
      { email: user.email, id: user.id, name: user.name },
      process.env.JWT_SECRET,
      {},
      (err, token) => {
        if (err) {
          console.log('JWT sign error:', err);
          return res.status(500).json({ error: 'Token creation failed' });
        }
        console.log('Login successful for user:', user.email);
        // Set cookie for normal usage
        res.cookie('token', token, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          sameSite: 'none', // Allow cross-site cookies for ngrok
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          domain: undefined // Let the browser set the domain automatically
        });
        
        // Also send token in response for localStorage fallback
        res.json({ ...userResponse, token });
      }
    );
    
   } catch (error) {
      console.log('loginUser error:', error);
      res.status(500).json({ error: 'Internal server error' });
   }
}

const getProfile=(req,res)=>{
    try {
    // Check for token in cookies first
    let token = req.cookies.token;
    
    // If no cookie token, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if(token){
      jwt.verify(token,process.env.JWT_SECRET,{},(err,user)=>{
          if(err) 
          {
                console.log('JWT verification error:', err);
            res.json(null)
          }
              else {
          res.json(user)
              }
      })
    }
    else{
      res.json(null)
    }
    } catch (error) {
        console.log('getProfile error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

const logoutUser = (req, res) => {
    try {
        console.log('Logout endpoint hit');
        res.clearCookie('token', {
          httpOnly: true,
          secure: false,
          sameSite: 'none',
          domain: undefined
        });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log('logoutUser error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

  const Cases= async (req, res) => {
    const {userId} = req.query;
  
    try {
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

            // Find user and their cases with related data
      const user = await User.findByPk(userId, {
        include: [{
          model: Case,
          as: 'cases',
          include: [
            { model: Clue, as: 'clues' },
            { model: Person, as: 'people' }
          ]
        }]
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
     }  
  
      res.json({ cases: user.cases || [] });
    } catch (error) {
      console.error('Cases fetch error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  const addCases= async(req,res)=>{
    try {
      const{userId,title,description,priority,status}=req.body;

      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.json({ error: "Invalid User" });
      }
      
      if (title.length < 3) {
        return res.json({ error: "Title is too short" });
      } else if (title.length > 100) {
        return res.json({ error: "Title must be 100 characters or less" });
      } else if (description.length < 10) {
        return res.json({ error: "Description is too short" });
      }
      
      // Create new case
      const newCase = await Case.create({
        title,
        description,
        priority: priority || 'Low',
        status: status || 'Open',
        userId
      });
      
      res.status(200).json({ message: "Case has been Added", case: newCase });
      
    } catch (error) {
      console.log('addCases error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

const deleteCase = async (req, res) => {
    try {
      const { caseId } = req.params;
      const { userId } = req.query;

      if (!caseId) {
        return res.status(400).json({ error: "Case ID is required" });
      }

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Find the case and check ownership
      const caseToDelete = await Case.findOne({
        where: { id: caseId, userId: userId }
      });

      if (!caseToDelete) {
        return res.status(404).json({ error: "Case not found or you don't have permission to delete it" });
      }

      // Delete the case (this will also delete related clues and people due to foreign key constraints)
      await caseToDelete.destroy();

      res.json({ message: "Case deleted successfully" });
      
    } catch (error) {
      console.log('deleteCase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

const updateCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { userId, title, description, priority, status } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: "Case ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find the case and check ownership
    const caseToUpdate = await Case.findOne({
      where: { id: caseId, userId: userId }
    });

    if (!caseToUpdate) {
      return res.status(404).json({ error: "Case not found or you don't have permission to update it" });
    }

    // Validate input
    if (title && title.length < 3) {
      return res.json({ error: "Title is too short" });
    }
    
    if (title && title.length > 100) {
      return res.json({ error: "Title must be 100 characters or less" });
    }

    if (description && description.length < 10) {
      return res.json({ error: "Description is too short" });
    }

    // Update the case
    const updatedCase = await caseToUpdate.update({
      title: title || caseToUpdate.title,
      description: description || caseToUpdate.description,
      priority: priority || caseToUpdate.priority,
      status: status || caseToUpdate.status
    });

    res.json({ 
      message: "Case updated successfully", 
      case: updatedCase 
    });
    
  } catch (error) {
    console.log('updateCase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports={
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
    Cases,
    addCases,
    deleteCase,
    updateCase
}