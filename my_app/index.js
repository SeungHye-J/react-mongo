import express from 'express';
import path from 'path';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import fs from 'fs';
import mongoose from 'mongoose';
import Moment from 'moment';

const formatNowDate = Moment().format('YYYY-MM-DD HH:mm:ss')

const __dirname = path.resolve();

const app = express();

//file path
// my_app/data/writng.json
const filePath = path.join(__dirname, 'data','writing.json');

//body parser set
app.use(bodyParser.urlencoded({ extended: false })); //express
app.use(bodyParser.json());

// view engine set
app.set('view engine','html'); //main.html -> main(.html)

// nunjucks
nunjucks.configure('views',{
    watch: true, // html 파일이 수정될 경우, 다시 반영 후 렌더링
    express: app
})

// mongoose connect
mongoose
    .connect('mongodb://127.0.0.1:27017/myDatabase')
    .then(() => console.log('DB 연결 성공'))
    .catch((err) => console.error(err));

// mongoose set
const { Schema } = mongoose;

const WritingSchema = new Schema({
    title: String,
    contents: String,
    date: {
        type: String,
        default: formatNowDate,
    }
})

const Writing = mongoose.model('Writing', WritingSchema);


// middleware
// main page GET
app.get('/', async (req, res) => {
    //const fileData = fs.readFileSync(filePath);
    //const writings = JSON.parse(fileData);

    let writings = await Writing.find({})

   // console.log(writings);
    res.render('main', { list: writings});

});

app.get('/write', (req,res) => {
    res.render('write');
});

app.post('/write', async (req,res) => {
    //request 안에 있는 내용을 처리
    //request.body
    const title = req.body.title;
    const contents = req.body.contents;
  //  const date = req.body.date;

/* 
    //데이터 저장
    //data/writing.json
    const fileData = fs.readFileSync(filePath); //파일 읽기

    const writings = JSON.parse(fileData);// 파일 변환

    //requst 데이터를 저장
    writings.push({
        'title': title,
        'contents': contents,
        'date': date
    });

    // data/writing.json에 저장하기
    fs.writeFileSync(filePath, JSON.stringify(writings));
*/


    //mongodb에 저장
    const writing = new Writing({
        title : title,
        contents: contents
    })
    const result = await writing.save().then(()=> {
        console.log('Success')
        res.render('detail', { 'detail' : {title: title, contents: contents} });
    }).catch((err) => {
        console.error(err)
        res.render('write')
    })
});

//상세
app.get('/detail/:id', async (req, res) => {
    const id = req.params.id;

    const detail = await Writing.findOne({ _id: id }).then((result) => {
        res.render('detail', { 'detail': result })
    }).catch((err) => {
        console.error(err)
    })
    // res.render('detail');
})

//삭제
app.post('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const delete_content = await Writing.deleteOne({ _id: id }).then(() => {
        console.log('delete success')
        res.redirect('/')
    }).catch((err) => {
        console.error(err)
    })
})

//수정페이지이동
app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    const edit = await Writing.findOne({ _id: id }).then((result) => {
        res.render('detail', { 'edit': result })
    }).catch((err) => {
        console.error(err)
    })
})

//수정
app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const contents = req.body.contents;

    const edit = await Writing.replaceOne({ _id: id }, { title: title, contents: contents }).then((result) => {
        console.log('update success')
        res.render('detail', { 'detail': { 'id': id, 'title': title, 'contents': contents } });
    }).catch((err) => {
        console.error(err)
    })
    
})


app.listen(3000, ()=>{
    console.log('Server is running');
});