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

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({
	uploadDir: './public/images' 
});

var fs = require("fs");


router.get('/', function (req, res, next) {
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		console.log(req.session.authid);
		console.log(req.session.authadmin);

		pool.getConnection(function(err,connection){
			var sqlForSelectList = "SELECT no, name, price, information, hit, img FROM product WHERE hit=0";
			connection.query(sqlForSelectList, function(err, rows){
				if(err) console.error("err: "+err);
				console.log("rows : " + JSON.stringify(rows));
				res.render('main', {title: 'WATCH SHOP', rows:rows, authid: req.session.authid, authadmin:req.session.authadmin});
				connection.release(); 
			});

		});
	}  
});

router.get('/write', function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else 
		res.render('write', {title:'WATCH SHOP',rows:rows, authid: req.session.authid, authadmin:req.session.authadmin});

});

router.post('/write', multipartMiddleware, function(req, res, next){
	console.log("aaa");
	var img = req.files['file'];

	var name = req.body.name;
	var brandname = req.body.brandname;
	var price = req.body.price;
	var information = req.body.information;
	var datas = [name, brandname, price, information, 0, 0, img.originalFilename];

	fs.rename(img.path, './public/images/' + img.originalFilename, function (err) {
		if (err) throw err;
		console.log('renamed complete');
	});

    //console.log(datas);
    pool.getConnection(function (err, connection) {
    	var sqlForInsertBoard = "insert into product(name, brandname, price, information, useflag, hit, img) value(?,?,?,?,?,?,?)";
    	connection.query(sqlForInsertBoard, datas, function (err, rows) {
    		if (err) console.log("err : " + err);

    		res.redirect('/main');
    		connection.release();
    	});
    });



});

router.get('/read/:no', function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		var no = req.params.no;
		pool.getConnection(function (err, connection) {
			var sql = "select no, name, brandname, price, information, hit, img from product where no=? and useflag =0";
			connection.query(sql, [no], function (err, row) {
				if (err) console.error(err);

				res.render('read', { title: "WATCH SHOP", row: row[0],authid: req.session.authid, authadmin:req.session.authadmin});
				connection.release();

			});

		});

	}
});

router.get('/logout', function(req, res,next){
	delete req.session.authid;
	delete req.session.authadmin;
	req.session.save(function(){
		res.redirect('/');
	});
});

router.post('/update', function(req, res, next){
	delete req.session.authid;
	delete req.session.authadmin;
	req.session.save(function(){
		res.redirect('/');
	});
});

router.get('/delete', function(req, res,next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		res.redirect('/main');
	}
});

router.post('/delete', function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		var no = req.body.no;
		var img = req.body.img;

		fs.unlink('./public/images/'+img, function (err) {
			if (err) console.log(err);
			console.log("successfully deleted ");

		});


		pool.getConnection(function (err, connection) {
			var sql = "delete from product where no=?";
			connection.query(sql, [no], function (err, result) {
				if (err) console.err("글 삭제 중 에러 발생 err: ", err);
				else res.redirect('/main');
				connection.release();

			});
		});


	}
});

module.exports = router;
