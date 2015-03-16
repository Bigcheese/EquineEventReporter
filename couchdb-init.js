{
   "_id": "_design/eer",
   "_rev": "3-e8c90df0792b6071e01d55d63711de9b",
   "language": "javascript",
   "views": {
       "events": {
           "map": "function(doc) {\n  if (doc.type == \"event\")\n    emit(doc._id, doc);\n}"
       },
       "players": {
           "map": "function(doc) {\n  if (doc.type == \"player\")\n    emit(doc._id, doc);\n}"
       },
       "matches": {
           "map": "function(doc) {\n  if (doc.type === \"match\")\n    emit([doc.event], doc);\n}"
       }
   }
}
