// import React, {createContext, useState, useEffect, useContext} from 'react';

// const AuthContext = createContext();

// export const useAuth = ()=>{
//     return useContext(AuthContext);  
// }

// export const AuthProvider = ({children})=>{  // this is a wrap up function we gonna use this in main.jsx so that full app having an access of user details lilke id and token
//     const [currentUser, setCurrentUser] = useState(null);
//     useEffect(()=>{
//         const userId = localStorage.getItem('userId');
//         if(userId){
//             setCurrentUser(userId);
//         }
//     }, []);

//     const value = {
//         currentUser, setCurrentUser
//     }

//     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }


//why we make this file
//we store data of user in local storage in login data means(jwt token and user id) whenever user user try to access any route so first we gonna perform check that user is login or not so for that we are making a context do that user get value in every screen
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(
        localStorage.getItem('userId') || null  // ✅ synchronous, no flicker
    );

    const value = {
        currentUser, setCurrentUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
