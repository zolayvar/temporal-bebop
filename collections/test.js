Test = new Mongo.Collection("test")

Meteor.methods({
     testInsert : function({a, b}) {
         Test.insert({"a":a, "b":b})
     },
     testGet : function({a}) {
         return Test.findOne({"a":a})
     },
     id : function() {
         return this.userId
     }
})
