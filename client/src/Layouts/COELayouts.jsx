// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'



export default function COELayouts() {
    const user=useSelector((state) => state.Auth.user)
       const navigate=useNavigate()
    // console.log(user)

    useEffect(()=>{
           if (!user || user.role !=="COE") {
               navigate('/login')
           }
    },[navigate, user])

    
  return (
    <>
    <Outlet/>

    </>
  )
}
