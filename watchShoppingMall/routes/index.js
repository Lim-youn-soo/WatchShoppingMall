var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit:5,
	host:'localhost',
	user:'root',
	database:'test',
	password:'rla102211'
});

var session = require('express-session');


/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(req.rows.name);
  console.log(req.session.authid);

  if(req.session.authid == undefined){
  	res.render('index', { title: 'WATCH SHOP' });
  }
  else{
  	res.redirect('/main');
  }
});



router.post('/',function(req,res,next){
	var id = req.body.member_id;
	var passwd = req.body.member_passwd;

	pool.getConnection(function(err,connection){
		var sqlForSelectList = "SELECT * FROM member WHERE id = ? and passwd = ?";
		connection.query(sqlForSelectList,[id, passwd], function(err, result){
			if(err) console.error("errrrrrrr: "+err);
			
			if(result =="") {
				//res.send("<script>alert('아이디 혹은 비밀번호가 일치하지 않습니다');history.back();</script>");
				connection.release();
				res.redirect('/');
			}
			else{
				rows = result;
			
			req.session.authno = result[0].no;
			req.session.authid = id;
			req.session.authadmin = result[0].admin;

			connection.release(); 
			req.session.save(function(){
				res.redirect('/main');
			});
			
			}
		});

	});

});

module.exports = router;
