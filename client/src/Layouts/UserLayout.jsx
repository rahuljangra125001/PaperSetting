import  { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
export default function UserLayout() {
    const user=useSelector((state) => state.Auth.user)
    const navigate=useNavigate()
    

    useEffect(()=>{
      if (!user || user.role !=="User") {
        navigate('/login')
    }
},[navigate, user])
  return (
    <Outlet/>
  )
}
