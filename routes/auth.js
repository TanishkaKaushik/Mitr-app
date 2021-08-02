const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const crypto = require('crypto')
const User = mongoose.model("User")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/keys')
const requireLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer');
require('dotenv').config();


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

router.post('/signup',(req,res)=>{
    const {name,email,password,pic} = req.body 
    if(!email || !password || !name){
       return res.status(422).json({error:"please add all the fields"})
    }
    User.findOne({email:email})
    .then((savedUser)=>{
        if(savedUser){
          return res.status(422).json({error:"user already exists with that email"})
        }
        bcrypt.hash(password,12)
        .then(hashedpassword=>{
              const user = new User({
                  email,
                  password:hashedpassword,
                  name,
                  pic
              })
      
              user.save()
              .then(user=>{
                transporter.sendMail({
                    from: "no-reply@mitr.com",
                    to: user.email,
                    subject: "Successful Signup",
                    html: "<h1>Thanks for signing up.</h1>"

                })
                res.json({message:"Saved Successfully"})
              })
              .catch(err=>{
                  console.log(err)
              })
        })
       
    })
    .catch(err=>{
      console.log(err)
    })
  })
     
               
  router.post('/signin',(req,res)=>{
    const {email,password} = req.body
    if(!email || !password){
       return res.status(422).json({error:"please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser=>{
        if(!savedUser){
           return res.status(422).json({error:"Invalid Email or password"})
        }
        bcrypt.compare(password,savedUser.password)
        .then(doMatch=>{
            if(doMatch){
               // res.json({message:"successfully signed in"})
               const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
               const {_id,name,email,followers,following,pic} = savedUser
               res.json({token,user:{_id,name,email,followers,following,pic}})
            }
            else{
                return res.status(422).json({error:"Invalid Email or password"})
            }
        })
        .catch(err=>{
            console.log(err)
        })
    })
})
  

router.post('/reset-password', (req,res)=>{
     crypto.randomBytes(32, (err,buffer)=>{
         if(err){
             console.log(err)
         }
         const token = buffer.toString("hex")
         User.findOne({email:req.body.email})
         .then(user=>{
             if(!user){
                 return res.status(422).json({error:"User don't exist with that email"})
             }
             user.resetToken = token
             user.expireToken = Date.now() + 3600000
             user.save().then((result)=>{
                 transporter.sendMail({
                     to:user.email,
                     from:"no-reply@mitr.com",
                     subject:"Password Reset",
                     html:`
                     <p>You requested for password reset.</p>
                     <h5>Click on this <a href="${EMAIL}/reset/${token}"> link </a> to reset password</h5>
                     `
                 })
                 res.json({message:"Check your email"})
             })
         })
     })
})

router.post('/new-password', (req,res)=>{
    const newPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({resetToken:sentToken, expireToken:{$gt: Date.now()}})
    .then(user=>{
        if(!user){
            return res.status(422).json({error:"Try again...Session expired"})
        }
        bcrypt.hash(newPassword, 12).then(hashedpassword=>{
            user.password= hashedpassword
            user.resetToken= undefined
            user.expireToken= undefined
            user.save().then((saveduser)=>{
                res.json({message:"Password updated successfully"})
            })
        })
    })
    .catch(err=>{
        console.log(err)
    })
})




module.exports = router