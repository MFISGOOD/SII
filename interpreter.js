function Interpreter()
{
    this.vars = {};
    this.functions = {};
    this.parse =[];
}

Interpreter.prototype.tokenize = function (program)
{
    if (program === "")
        return [];

    var regex = /\s*(=>|[-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
    return program.split(regex).filter(function (s) { return !s.match(/^\s*$/); });
};

Interpreter.prototype.input = function(expr)
{
    var tokens = this.tokenize(expr);
    if(tokens.length > 0 && tokens[0] === 'fn'){
    	this.functionDefinition(tokens);
    } else{
           var parse= this._expresion(tokens); 
           this.evaluate(parse);
           return parse;
    }
};


Interpreter.prototype.unit = function(tokens)
{
    	let  match, expr;  
    	let token =tokens.shift();
    	if (match = /\d*\.?\d+/.exec(token))
              expr = {type: "value", value: parseFloat(match[0])};  
          else if(match = /^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token))
              expr = {type: "identifier", name: match[0]}; 
          else if (token == '(') 
          	    expr = {type: "expresion", name: '('}; 
          	else 
          throw new SyntaxError("Unexpected syntax: " + token);
          return expr;
}
Interpreter.prototype.factor =function(tokens){
   let unit = this.unit(tokens);
   switch(unit.type){
       case 'value' : return unit;
       case 'identifier' : {
       	 if(tokens[0] == "="){
             tokens.shift();
             return {type : 'assignment',left :unit.name , right: this._expresion(tokens)} 
          }  
       	if( !(/[ + | \- | \/ | * | %]/.exec( tokens[0]))  &&  tokens[0] !== ')' ){
            let expr = this._expresion(tokens);
       		let args = [];
       		while (expr){
       			args.push(expr);
       			expr = this._expresion(tokens);
       		}
                      return {type : 'function-call',name :unit.name , args: args} 
       	  }
            	    
          else {
       	    return {type : 'variable', name : unit.name };  
       	}
       }
       case 'expresion' : {
       	           // tokens.unshift('(')
       	           let expr = this._expresion(tokens);
       	           if(tokens.length === 0 || tokens[0] != ')')
       	                  throw new SyntaxError("Unexpected syntax: ");           
       	           tokens.shift();
                 return expr;  
       }
       default : throw new SyntaxError(`Unexpected token ${tokens[0]}`);
     
   }
}


Interpreter.prototype._expresion = function(tokens){
   if (tokens.length === 0 || tokens[0] ===')' ) return null;
   let factor = this.factor(tokens);
   let match ;
   let operations=[];
   operations.push(factor);
      
   if(match = /[ + | \- | \/ | * | %]/.exec(tokens[0])){
            tokens.shift();
            operations.push(match[0]);
            let right = this._expresion(tokens);
            right = typeof(right) === 'object' && 'value' in right ? right.value : right;
            operations.push(...right);
            return {type:'apply' ,value: operations};
   } else{
   	 return operations;  
   }
}

Interpreter.prototype.evaluate = function (expr) {
  switch(expr.type) {
	    case "value":
	      return expr.value;
	    case "variable":
	      if (expr.name in this.vars)
	        return this.vars[expr.name];
	      else
	        throw new ReferenceError("Undefined variable: " +
	                                 expr.name);
	    case "function-call":
	      if (expr.name in this.functions)
	        return apply(null, expr.args.map(function(arg) {
	            return evaluate(arg);
	        }));
	      else
	        throw new ReferenceError("Undefined function: " +
	                                 expr.name);
	    case 'assignment' : {
	    	 if(expr.left in this.functions)
	    	 	throw new ReferenceError(`${expr.left} is a function`);
	            this.vars[expr.left] = this.evaluate(expr.right);    
	            return   this.vars[expr.left];
	    }

	    case "apply":{
	    	this.parse.push(this.evaluate(expr.value[0]));
	    	this.parse.push(expr.value[1]);
	    	this.parse.push(this.evaluate(expr.value[0]));
	    } 
	     
  }
}

Interpreter.prototype.functionDefinition = function(tokens){
	var save = tokens.join(' ');
	let  fn_keyword = 'fn';
	let fn_name = null;
	let fn_operator = null;
	let fn_body = null;
	let token = tokens.shift() ;
	if(token && token !== 'fn')
		throw new SyntaxError("Unexpected syntax: " + token);
           token = tokens.shift() ;
           if ( token && /^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token) && token != 'fn' && !(token in this.functions)){
              fn_name = token;	
              if(fn_name in this.vars)
              	throw new SyntaxError(`${fn_name} is a variable.`);
           }
	else
	     throw new SyntaxError("Unexpected syntax: " + token);

           token = tokens.shift() ;
           let args =[];
           while (tokens.length > 0 && token !== '=>'){
                if (/^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token))
                	args.push(token);
                else
                    throw new SyntaxError("Unexpected syntax: " + token);   
                token = tokens.shift() ;
                if(token === '=>') fn_operator = token;
           } 
           fn_body = this.expresion(tokens);
           if(fn_name && fn_operator && fn_body){
              this.functions[fn_name] = {args : args , body : fn_body};	
           }else{
              throw new SyntaxError("Unexpected syntax: " + save);	
           }            
}





