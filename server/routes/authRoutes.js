const express=require ('express');
const router =express.Router();
const{addCases,test,registerUser,loginUser,getProfile,logoutUser,Cases,deleteCase,updateCase}=require('../controllers/authControllers')

router.post('/login',loginUser)
router.post('/logout',logoutUser)
router.get('/',test)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
})
router.post('/register',registerUser)
router.get('/profile',getProfile)
router.get('/cases',Cases)
router.post('/cases',addCases)
router.put('/cases/:caseId',updateCase)
router.delete('/cases/:caseId',deleteCase)


module.exports=router