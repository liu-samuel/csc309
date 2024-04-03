import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const RequireAuth = ({ children }) => {
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
    }, [user])

    return user ? <>{children}</> : null
}

export default RequireAuth
