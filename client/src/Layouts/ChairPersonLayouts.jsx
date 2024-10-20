import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'


export default function ChairPersonLayouts() {
    const user=useSelector((state) => state.Auth.user)
       const navigate=useNavigate()
    // console.log(user)

    useEffect(()=>{
           if (!user || user.role !=="Chairperson") {
               navigate('/login')
           }
    },[navigate, user])
  return (
    <>
    <Outlet/>

    </>
  )
}
