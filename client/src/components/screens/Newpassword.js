import React, {useState, useContext} from 'react'
import {Link, useHistory, useParams} from 'react-router-dom'
import M from 'materialize-css'


const Signin = () =>{
        const history = useHistory()
        const [password,setPasword] = useState("")
        const{token} = useParams()
        console.log(token)
        const PostData = ()=>{

          
           fetch("/new-password",{
            method:"post",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                password,
                token
            })
            }).then(res=>res.json())
              .then(data=>{
                  console.log(data)
                if(data.error){
                  M.toast({html: data.error,classes:"#c62828 red darken-3"})
               }
               else{
                M.toast({html: data.message ,classes:"#43a047 green darken-1"})
                history.push('/signin')
                }
              })
              .catch(err=>{
                console.log(err)
            })
            }
    return(
        <div>
              <div className="mycard">
              <div className="card auth-card input-field">
              <h2 className="brand-logo middle">Mitr</h2>
            <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e)=>setPasword(e.target.value)}
            />
             <button className="btn waves-effect waves-light #64b5f6 blue darken-1"
               onClick={()=>PostData()}
            >
                Update 
            </button>
              </div>
              </div>
        </div>
    )
    
}

export default Signin