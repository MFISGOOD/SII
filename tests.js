var interpreter = new Interpreter();
    
// Basic arithmetic
report(interpreter.input("1 + 1"), 2);
report(interpreter.input("2 - 1"), 1);
report(interpreter.input("2 * 3"), 6);
report(interpreter.input("8 / 4"), 2);
report(interpreter.input("7 % 4"), 3);

// //Variables
report(interpreter.input("x = 1"), 1);
report(interpreter.input("x"), 1);
report(interpreter.input("x + 3"), 4);
report(function() { interpreter.input("y"); },'Undefined variable: y');

// //Functions
interpreter.input("fn avg x y => (x + y) / 2"); 
report(interpreter.input("avg 4 2"), 3);
try{
    interpreter.input('fn avg => (x + y) / 2)')
}catch(err){
  report(err.message,0);	
}

report(function() { interpreter.input("avg 7"); });
report(function() { interpreter.input("avg 7 2 4"); });

// //Conflicts
report(function() { interpreter.input("fn x => 0"); });
report(function() { interpreter.input("avg = 5"); });
report(function() { interpreter.input("fn avg => 0"); });