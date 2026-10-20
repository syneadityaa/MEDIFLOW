const bcrypt = require('bcryptjs')
const prisma = require('../config/prisma')

async function registerUser(req,res){
    try{
        const{name,email,password} = req.body;

        if(!name || !email || !password){
          return res.status(400).json({
            "message" : "Name, Email ,Password are required for registeration",
          });
        }

        if(
            typeof name != "string"||
            typeof email != "string" ||
            typeof password != "string"
        ){
            return res.status(400).json({
                "message" : "Please enter valid credentials",
            });
        }

        if (!email.includes("@") || !email.includes(".")) {
         return res.status(400).json({
        message: "Please enter a valid email"
    });
}

        if(password.length < 8){
            return res.status(400).json({
                "message" : "Password must be at least of 8 characters",
            });
        }
       
        const normalizedEmail = email.trim().toLowerCase();

        if(!normalizedEmail || !name.trim()){
            return res.status(400).json({
                "message" : "Name or Email cannot be empty",
            });
        }

       const existingUser = await prisma.user.findUnique({
        where : {email : normalizedEmail},
       }) 

       if(existingUser){
        return res.status(409).json({
            "message" : "User with this email already exists",
        });
       }

    const passwordHash = await bcrypt.hash(password,12)

      const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "PATIENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      user,
    });  
    }catch(error){
        if(error.code === "P2002"){
            return res.status(409).json({
                "message" : "User with this email already exists",
            });
        }

    console.error("Registeration error",error)

    return res.status(500).json({
        "message" : "Something went wrong during registeration",
    });

    }
}

module.exports = {registerUser}