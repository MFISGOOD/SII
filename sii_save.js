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
   if((!expr && expr != '') || !(typeof(expr) === 'string' || expr instanceof String) ) throw new SyntaxError(`invalid expresion ${expr}`);
   if(expr.trim() === "") return '';	
    var tokens = this.tokenize(expr);
    if(tokens.length > 0 && tokens[0] === 'fn'){
    	this.functionDefinition(tokens);
    } else{
           var parse= this._expresion(tokens); 
           // console.log(parse);
          return(this.evaluate(parse));
         
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
       	if( !(/^[ + | \- | \/ | * | %]/.exec( tokens[0]))  &&  tokens[0] !== ')' && unit.name in this.functions){
            let expr = this._expresion(tokens);
       		let args = [];
       		while (expr){
       			args.push(this.evaluate(expr)); //argument is immediately evaluated
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
      
   if(match = /^[ + | \- | \/ | * | %]/.exec(tokens[0])){
            tokens.shift();
            operations.push(match[0]);
            let right = this._expresion(tokens);
            right = typeof(right) === 'object' && 'value' in right  && Array.isArray(right.value)? right.value : right;
           if(Array.isArray(right)){
              operations.push(...right);
           }else{
              operations.push(right);
           }           
            return {type:'apply' ,value: operations};
   } else{
   	 return factor;  

   }
}

Interpreter.prototype.evaluate = function (expr,localScope) {
  switch(expr.type) {
	    case "value":
	      return expr.value;
	    case "variable":{
	    	if(localScope && expr.name in localScope){ 
	                 return localScope[expr.name];	
	    	}
	    	if (expr.name in this.vars)
	              return this.vars[expr.name];
	          else
	               throw new ReferenceError("Undefined variable: " +
	                                 expr.name);
	    }
	      
	    case "function-call":{
	    	if (expr.name in this.functions){
	    	       if(expr.args.length !==  this.functions[expr.name].args.length)
	    	       	throw new SyntaxError("Wrong number of arguments");
	    	       let localScope = {};
                            for(key in this.functions[expr.name].localScope){
	                               if(expr.args.length > 0){
	                               	   localScope[key] = expr.args.shift();
	                               }else{
	                               	 break;
	                               }
                            } 
                            return this.evaluate(this.functions[expr.name].body, localScope);                 
	    	}else{
	    		throw new ReferenceError("Undefined function: " +
	                                 expr.name);
	    	}       
	    }     
	    case 'assignment' : {
	    	if(localScope){ 
	                 localScope[expr.left] = this.evaluate(expr.right,localScope);    
	                return   localScope[expr.left];
	    	 }
	    	 if(expr.left in this.functions)
	    	 	throw new ReferenceError(`${expr.left} is a function`);
	            this.vars[expr.left] = this.evaluate(expr.right);    
	            return   this.vars[expr.left];
	    }

	    case "apply":{
	    	let reduce = expr.value.map(function(el){
                           if(/^[ + | \- | \/ | * | %]/.exec(el)){
                           	return el;
                           }else{
                           	if(localScope){
                                   return this.evaluate(el,localScope)
                           	}else{
                           	   return this.evaluate(el)	
                           	}                        	
                           }
	    	}.bind(this));
	    	return _reduce(reduce)
	    } 
	     
  }
}
function _reduce(arr){
	let result = [];
	if(arr && Array.isArray(arr)){
		arr=arr.filter(el => el !== true)
		let find = 0;
      arr.forEach((value,index) => {  	 
          switch(value){
      	                     case '*' : find = '*'; break;
			case '/' : find = '/' ; break;
			case '%' : find = '%' ; break;
			default :  {
				if(find){
					switch(find){
						case  '*' : result[result.length-1]= value * result[result.length-1] ;find =0; break;
						case  '/' : result[result.length-1]= result[result.length-1]/value  ;find=0; break;
						case  '%' : result[result.length-1]= result[result.length-1]%value  ;find=0; break;
					}
				}else{
					if(Array.isArray(value)){
						result.push( _reduce(value))
					}else{
						result.push(value);
					}
					
				}
			}
		   }
      });
	}
    return result.filter(el => el !== true).reduce((acc,next)=>{
    	if(acc.left === null){
    		acc.left=next;
    	}else{
    		if(acc.op === null){
    			acc.op = next;
    		}else if(acc.right === null){
    				acc.right = next;
    				acc.left = acc.op === '+' ? acc.left + acc.right : (acc.op === '-' ? acc.left - acc.right : undefined );
    				acc.right = null;
    				acc.op =null;
    		}
    	}
    	return acc;
        },{left:null,right:null,op:null}).left;
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
           if ( token && /^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token) && token != 'fn'){
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
               
           } 
           fn_operator = token; 
           if(fn_operator !== '=>') throw new SyntaxError("Unexpected syntax: " + save);
           fn_body = this._expresion(tokens);
           if(fn_name && fn_operator && fn_body){
              let scope ={};
              args.forEach(arg => scope[arg]=undefined);
              this.functions[fn_name] = {args : args , body : fn_body,localScope:scope};	
           }else{
              throw new SyntaxError("Unexpected syntax: " + save);	
           }            
}





