var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit:5,
	host:'localhost',
	user:'root',
	database:'watchshop',
	password:'309qkfsoa'
});
var session = require('express-session');
var app = express();


router.get('/', function (req, res, next) {
	if(req.session.authid == undefined){
		res.redirect('/index');
	}
	else{
	console.log(req.session.authid);
	console.log(req.session.authadmin);
	
    pool.getConnection(function(err,connection){
    	var sqlForSelectList = "SELECT no, name, price, information, hit, img FROM product WHERE hit =0";
    	connection.query(sqlForSelectList, function(err, rows){
    		if(err) console.error("err: "+err);
    		console.log("rows : " + JSON.stringify(rows));
    		res.render('main', {title: 'WATCH SHOP', rows:rows});
    		connection.release(); 
    	});

    });
  }  
});

module.exports = router;
