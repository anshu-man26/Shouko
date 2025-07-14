import api from '../src/api';
import { createContext ,useState,useEffect} from 'react';

export const UserContext= createContext({})

export function UserContextProvider({children}){
    const [user,setUser]=useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(()=>{
        // First try to get user from localStorage
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsLoading(false);
            } catch (error) {
                console.log('Error parsing stored user data:', error);
            }
        }
        
        // Then try to get fresh data from server
        api.get('/profile').then(({data})=>{
            if (data) {
                setUser(data);
                // Store in localStorage for persistence
                localStorage.setItem('user_data', JSON.stringify(data));
            }
            setIsLoading(false);
        }).catch((error) => {
            console.log('Profile fetch failed:', error);
            // If server fails but we have stored data, keep using it
            if (!storedUser) {
                setUser(null);
            }
            setIsLoading(false);
        })
    },[])
    
    const updateUser = (userData) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem('user_data', JSON.stringify(userData));
        } else {
            localStorage.removeItem('user_data');
        }
    };
    
    return (
        <UserContext.Provider value={{user, setUser: updateUser, isLoading}}>
            {children}
        </UserContext.Provider>
    )
}