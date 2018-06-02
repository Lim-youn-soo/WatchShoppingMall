var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',
    database: 'sedb',
    password: '4759655'
});
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('joinForm', { title: '회원가입' });
});

router.post('/', function(req, res, next) {
  var id = req.body.id;
  var passwd = req.body.passwd;
  var name = req.body.name;
  var tel = req.body.tel;
  var address= req.body.address;
  var email = req.body.email;
  var size=req.body.size;
  var price=req.body.price;
  var texture=req.body.texture;
  var kind=req.body.kind;
  var datas = [id, passwd, name, tel, address, email, 0, size, price, texture, kind];
  console.log(datas);
  console.log(req.body);
  pool.getConnection(function(err, connection)
  {
      //Use the connection

      var sqlForInsertBoard = "insert into member(id, passwd, name, tel, address, email, admin, size, price, texture, kind) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      connection.query(sqlForInsertBoard,datas, function(err, rows) {
          if(err) console.error("err : " + err);
          console.log("rows : " + JSON.stringify(rows));

          //res.redirect('/board');
          connection.release();

          // Don't use the connection here, it has been returned to the pool.
      });
    });
});

module.exports = router;
