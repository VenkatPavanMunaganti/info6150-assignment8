const router = require("express").Router();
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const User = require("../models/userModel");
const validateUser = require("../validations/userValidations");

router.get("/check", async (req, res) => {
    res.status(200).send("<h1>Server is running</h1>")
})

router.post("/create", async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const errorMsgs = validateUser(fullname, email, password);
        const user = await findUserByMailId(email)

        if (!fullname || !email || !password) {
            res.status(501).json({
                "CreateError": `Invalid parameters, Please pass fullname, email, password`
            })
        } else {
            if (user) {
                res.status(501).json({
                    "CreateError": `User with mail id ${email} already exists`
                })
                res.send()
            } else {
                if (Object.keys(errorMsgs).length > 0) {
                    res.status(501).json(errorMsgs)
                    res.send()
                } else {
                    const salt = await bcrypt.genSalt();
                    const passwordHash = await bcrypt.hash(password, salt);

                    const newUser = new User({
                        fullname: fullname,
                        email: email,
                        password: passwordHash,
                    });

                    const savedUser = await newUser.save();
                    res.json(savedUser);
                }
            }
        }


    } catch (error) {
        console.log(error["code"])
        res.status(500).json({ err: error.message });
    }
});

router.get("/getAll", async (req, res) => {
    try {
        const users = await userModel.find({})
        res.send(users)
    } catch (error) {
        console.log(error)
    }
})

router.put('/update/:mailid', async (req, res) => {
    const mailId = req.params.mailid
    const { fullname, password } = req.body

    const user = await findUserByMailId(mailId)
    if (!mailId || !fullname || !password) {
        res.status(501).json({
            "UpdateError": `Invalid parameters, Please pass mail id in the url, and username and password in json`
        })
    } else {
        if (!user) {
            res.status(501).json({
                "UpdateError": `User with mail id ${mailId} not exists`
            })
        } else {
            const errorMsgs = validateUser(fullname, null, password)
            if (Object.keys(errorMsgs).length > 0) {
                res.status(501).json(errorMsgs)
                res.send()
            } else {
                const salt = await bcrypt.genSalt()
                const passwordHash = await bcrypt.hash(password, salt)
                user.fullname = fullname
                user.password = passwordHash
                await user.save();
                res.status(200).json(user)
                res.send()
            }
        }
    }
});

router.delete("/delete/:mailid", async (req, res) => {
    const mailId = req.params.mailid
    const user = await findUserByMailId(mailId)

    if (!mailId ) {
        res.status(501).json({
            "DeleteError": `Invalid parameters, Please pass mail id in the url to delete`
        })
    }else{
        if (!user) {
            res.status(501).json({
                "DeleteError": `User with mail id ${mailId} not exists`
            })
        } else {
            await user.remove()
            res.send(await userModel.find({}))
        }
    }
})

async function findUserByMailId(mailid) {
    try {
        const user = await userModel.findOne({ email: mailid })
        return user
    } catch (error) {
        console.log(error)
    }
}

module.exports = router;