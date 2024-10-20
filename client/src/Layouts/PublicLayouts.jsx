import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'

export default function PublicLayouts() {
    const user = useSelector((state) => state.Auth.user)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            if (user.role === 'COE') {
                navigate('/COEDashboard')  // Correct route path
            } else if (user.role === 'Chairperson') {
                navigate('/ChairpersonDashboard')  // Correct route path
            } else if (user.role === 'PanelMember') {
                navigate('/PanelDashboard')  // Correct route path
            } else if (user.role === 'User') {
                navigate('/UserDashboard')
            }else {
                navigate('/')
            }
        }
    }, [user, navigate])

    return (
        <Outlet />  
    )
}
