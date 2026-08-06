const bcrypt = require("bcrypt");

bcrypt.hash("Admin123+",10)
.then(hash=>{
    console.log(hash);
});