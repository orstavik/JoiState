##JoiGraph
The JoiGraph is a set of static methods to do immutable changes to objects.
###TODO
1) It does not handle arrays
2) How should empty objects be handled? 
  * {} and undefined are treated as nothing and removed from many results.
  * Null is treated as a filter in some methods to be able to send messages about 
things to be deleted.