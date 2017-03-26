var imageSearch = require('node-google-image-search');
var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var queryLog = Schema({
    date:{type:String,required:true},
    query:{type:String,required:true},
    offset:{type:Number,default:0}
});
var qLog = mongoose.model('qLog',queryLog);
var app = express();

mongoose.Promise = global.Promise;
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };
mongoose.connect(process.env.PROD_MONGODB,options);

var conn = mongoose.connection;
conn.on('error',console.error.bind(console,'connection error'));
conn.once('open',function(){
  console.log('Connected to DB');
});


app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

var port = process.env.PORT||8080;
app.get('/',function(req,res){
   res.render('index'); 
});

app.get('/',function(req,res){
   res.render('home'); 
});

app.get('/api/imagesearch/:query',function(req,res){
   var imgQuery = req.params.query;
   var resObj = '';
   var qDate = new Date().toUTCString();
   qLog.create({date:qDate,query:imgQuery,offset:req.query.offset},function(err,docs){
       if(err) console.error(err);
       console.log('Added query to database');
   });
   imageSearch(imgQuery,function(data){
       for(var x=0;x<data.length;x++){
       resObj += '<a href="' + data[x].link + '" style="text-decoration:none;"><div style="box-shadow: 0px 0px 15px 0px rgba(0,0,0,0.75);text-align:center;color:#CFD8DC;font-size:15px;border-radius:10px;background:#455A64;height:80px;width:400px;margin:20px auto;display:flex;vertical-align:middle;"><img src="' + data[x].link +'" width=50px height=50px style="left:0;border-radius:5px;margin:15px;"><p style="margin:0 auto;margin-top:15px;">Title: ' + data[x].title.substr(0,25) + '...<br><br>Context: ' + data[x].image.contextLink.substr(0,25) + '...</p></div></a>';
       }
       res.render('index',{
           resultTitle:imgQuery,
           result:resObj
       });
   },req.query.offset,4)
});
app.get('/api/latest/imagesearch',function(req,res){
    var latestInfo = '';
qLog.find().sort({date:-1}).exec(function(err,docs){
    if(err) console.error(err);
    for(var x = 0;x < docs.length;x++){
        latestInfo += "<h5 style='color:#CFD8DC'>Query: '" + docs[x].query +"' on "+ docs[x].date +"</h5>";
    }
}).then(function(){
       res.render('index',{
       resultTitle:'Latest',
       result:latestInfo
   }); 
});
});

app.listen(port,function(){console.log('App running');});