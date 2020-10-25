const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.set('view engine', 'ejs');
const password = 'Test123', dbname = 'todolistDB';
async function connectToDB() {
    await mongoose.connect(`mongodb+srv://admin-darwin:${password}@cluster0.zixju.mongodb.net/${dbname}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(res => {
            console.log('Connected');
        })
        .catch(err => {
            console.log(err);
        });
}

connectToDB();

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Needs to include the name of the item']
    }
});

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Needs to include the name of the list']
    },
    items: [itemsSchema]
});

const List = mongoose.model('List', listSchema)

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: 'Welcome to your to do list!'
});

const item2 = new Item({
    name: 'Hit the + button to add a new item.'
});

const item3 = new Item({
    name: '<-- Hit this checkbox to delete an item.'
});

const defaultItems = [item1, item2, item3]

app.get('/', (req, res) => {        
    Item.find({}, (err, items) => {
        if (err) { console.log(err); }
        else{
            if (items.length === 0) {
                Item.insertMany(defaultItems, err => {
                    if (err) console.log(err);
                    else console.log('Default Items added!');
                })
                res.redirect('/');
            }
            res.render('list', {listTitle: date.getDate(), listItems: items, route: '/'});        
        }
    })
    
})
app.post('/', (req, res) => { 
    const newItem = new Item({
        name: req.body.newItem
    });
    newItem.save();
    res.redirect('/');
})
app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === date.getDate()){
        Item.findByIdAndRemove(checkedItemId, err => {
            if (err) { console.log(err); }
            else { res.redirect('/'); }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if (err) { console.log(err) }
            else { res.redirect(`/${listName}`); }
        })
    }
});
app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, (err, foundList) => {
        if (err) { console.log(err); }
        else {
            if (foundList) {
                res.render('list', {listTitle: foundList.name, listItems: foundList.items, route: req.params.customListName })
            } else {
                const newList = new List({
                    name: req.params.customListName,
                    items: defaultItems
                });
                
                newList.save();
                res.redirect('/' + customListName);
            }
        }
    })
});
app.post('/:customListName', (req, res) => {
    const newItem = new Item({
        name: req.body.newItem
    });
    List.findOne({name: req.params.customListName}, (err, foundList) => {
        if (err) { console.log(err); }
        else{
            const updatedItems = foundList.items.concat(newItem);
            List.findOneAndUpdate({name: req.params.customListName}, {items: updatedItems}, err => {
                if (err) { console.log(err); }
                else { res.redirect('/' + req.params.customListName); }
            });
        }
    })
    
    
})
app.get('/about', (req, res) => {
    res.render('about', {})
})

const port = process.env.PORT;
if (port === null || port === ""){
    port = 5050;
}
app.listen(port, ()=> {
    console.log(`Port started in port ${port}.`);
})