const bcrypt= require('bcrypt')
const jwt = require('jsonwebtoken')

const hashPassword=(password)=>{
    return new Promise((resolve,reject)=>{
        bcrypt.genSalt(8,(err,salt)=>{
            if(err){
                reject(err)
            }
            bcrypt.hash(password,salt,(err,hash)=>{
            if(err)
            {
                reject(err)
            } 
            resolve (hash) 
            })
        })
    })
}

const comparePassword =(password,hashed)=>{
    return bcrypt.compare(password,hashed)
}

const authenticateToken = (req, res, next) => {
    try {
        // Try to get token from Authorization header
        let token = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // Fallback to cookie if not in header
        if (!token && req.cookies) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
            if (err) {
                console.log('JWT verification error:', err);
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        console.log('authenticateToken error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports={
    hashPassword,
    comparePassword,
    authenticateToken
}
