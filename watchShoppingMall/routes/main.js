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
			var sqlForSelectList = "SELECT no, name, price, information, hit, img FROM product WHERE useflag=0";
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
	var date = req.body.date;
	var datas = [name, brandname, price, information, 0,  img.originalFilename,0,date];

	fs.rename(img.path, './public/images/' + img.originalFilename, function (err) {
		if (err) throw err;
		console.log('renamed complete');
	});

    //console.log(datas);
    pool.getConnection(function (err, connection) {
    	var sqlForInsertBoard = "insert into product(name, brandname, price, information, hit, img, useflag,date) value(?,?,?,?,?,?,?,?)";
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
			var sql = "select no, name, brandname, price, information, hit, img, date from product where no=? and useflag =0";
			connection.query(sql, [no], function (err, row) {
				if (err) console.error(err);

				var sql ="select member_id, value, date from review where product_no =?"
				connection.query(sql, [no], function(err, review){
					if(err) console.error(err);
					res.render('read', { title: "WATCH SHOP", row: row[0], review:review, authid: req.session.authid, authadmin:req.session.authadmin});
					connection.release();

				})


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

router.get('/update',function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		console.log(req.query);
		var no = req.query.product_no;
		var name = req.query.name;
		var brandname = req.query.brandname;
		var img = req.query.img;
		var price = req.query.price;
		var information = req.query.information;
		res.render('update',{title:'WATCH SHOP', authid: req.session.authid, authadmin:req.session.authadmin, no:no, name:name, brandname:brandname, img:img, price:price, information:information});
		//res.redirect('/main');
	}
});


router.post('/update',multipartMiddleware, function(req, res, next){
	var no = req.body.product_no;
	var name = req.body.name;
	var brandname = req.body.brandname;
	var price = req.body.price;
	var information = req.body.information;
	var img = req.files['file'];
	var dataset = [name,brandname,price,information,img.originalFilename,no];
	console.log(brandname);

	fs.rename(img.path, './public/images/' + img.originalFilename, function (err) {
		if (err) throw err;
		else console.log('renamed complete');
	});

	pool.getConnection(function (err, connection) {
		var sql ="update product set name=?,brandname=?,price=?,information=?,img=? where no = ?";
		connection.query(sql,dataset, function(err, result){
			if(err) console.error("수정 중 에러 발생 err: ",err);
			else{
				connection.release();
				res.redirect('/main/read/'+no);
			}
		});
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
				if (err) console.error("글 삭제 중 에러 발생 err: ", err);
				else {
					sql = "delete from review where product_no=?";
					connection.query(sql,[no], function(err, result2){
						if(err) console.error("리뷰 삭제 중 에러 발생 err:" + err);
						else{
							res.redirect('/main');
							connection.release();
						}
					});


				}

			});
		});


	}
});

router.get('/buy', function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		res.redirect('/main');
	}
});


router.post('/buy', function(req,res,next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		console.log(req.body);
		var member_no = req.session.authno;
		var product_no = req.body.product_no;
		var date = req.body.buyDate;
		//console.log(req.body);
		pool.getConnection(function (err, connection) {
			var sql = "insert into history(member_no, product_no, date) value(?,?,?)";
			connection.query(sql, [member_no, product_no, date], function (err, result) {
				if (err) console.error("구매 중 에러 발생 err: ", err);
				else {

					sql = "update product set hit = hit+1 where no=?"
					connection.query(sql, [product_no], function (err, result) {
						if (err) console.error("히트 수 조작 중 에러 발생 err: ", err);
						else{
							connection.release();	
							res.redirect('/main');
						}

					});
				}
			});
		});	
	}


});

router.post('/review',function(req, res, next){
	if(req.session.authid == undefined){
		res.redirect('/');
	}
	else{
		var no = req.body.reviewNo;
		var id = req.body.reviewId;
		var review = req.body.reviewValue;
		var date = req.body.reviewDate;

		pool.getConnection(function (err, connection) {
			var sql = "insert into review(product_no, member_id,value, date) value(?,?,?,?)";
			connection.query(sql, [no, id, review,date], function (err, result) {
				if (err) console.error("구매 중 에러 발생 err: ", err);
				else {
					res.redirect('/main/read/'+no);

				}
			});
		});	

	}

});

module.exports = router;
