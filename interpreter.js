function Interpreter()
{
    this.vars = {};
    this.functions = {};
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
   if((!expr && expr != '') || !(typeof(expr) === 'string' || expr instanceof String) ) throw new SyntaxError(`invalid expression ${expr}`);
   if(expr.trim() === "") return '';  
    var tokens = this.tokenize(expr);
    if(tokens.length > 0 && tokens[0] === 'fn'){
      return this.functionDefinition(tokens);
    } else{
           var parse = this.expression(tokens); 
           return(this.evaluate(parse));
         
    }
};


Interpreter.prototype.unit = function(tokens)
{
      let  match, expr;  
      let token =tokens.shift();
      if (match = /^\d*\.?\d+/.exec(token))
              expr = {type: "value", value: parseFloat(match[0])};  
          else if(match = /^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token))
              expr = {type: "identifier", name: match[0]}; 
          else if (token == '(') 
                expr = {type: "expression", name: '('}; 
            else 
          throw new SyntaxError("Unexpected syntax: " + token);
          return expr;
}
Interpreter.prototype.factor =function(tokens,fn=false){
   let unit = this.unit(tokens);
   switch(unit.type){
       case 'value' : { //number
        return unit;
       }
       case 'identifier' : {
         if(tokens[0] == "="){ //assignment
             tokens.shift();
             return {type : 'assignment',left :unit.name , right: this.expression(tokens,false,false,false,true)} 
          }  
        if( !(/^[ + | \- | \/ | * | %]/.exec( tokens[0]))  &&  tokens[0] !== ')' && unit.name in this.functions){ //function call
              let nbreOfArguments= this.functions[unit.name].args.length;
              let args = [];
              if(nbreOfArguments === 0) return {type : 'function-call',name :unit.name , args: args} 
              let expr ;
              while (nbreOfArguments && (expr = this.expression(tokens,false,true,false,false,true))){
                args.push(expr); //argument is immediately evaluated
                --nbreOfArguments;
              }
              args= args.map(el => this.evaluate(el));
              return {type : 'function-call',name :unit.name , args: args} 
         }             
         else {
            return {type : 'variable', name : unit.name };  // identifier
         }
       }
       case 'expression' : { // (expression)
                 let expr = this.expression(tokens,true);
                 if(tokens.length === 0 || tokens[0] != ')')
                         throw new SyntaxError("Unexpected syntax: ");           
                 tokens.shift();
                 if(!fn && expr.type === 'apply'){    
                       expr.value=this.evaluate(expr);
                       expr.type = 'value';
                  }         
                 return expr;  
       }
       default : throw new SyntaxError(`Unexpected token ${tokens[0]}`);
     
   }
}

//I admit that there are too many arguments but there is a way to refactor it
Interpreter.prototype.expression = function(tokens,delimiter = false,argument=false,fn=false,assignment=false,function_call=false){
   if (tokens.length === 0) return null;
   let factor = this.factor(tokens,fn);
   let match ;
   let operations=[];
   operations.push(factor);
   if (tokens.length === 0 ||  (tokens[0] === ')' && delimiter)) return factor;
   if(match = /^[ + | \- | \/ | * | %]/.exec(tokens[0])){
            tokens.shift();
            operations.push(match[0]);
            let right = this.expression(tokens,delimiter,argument,fn,assignment);
            right = typeof(right) === 'object' && 'value' in right  && Array.isArray(right.value)? right.value : right; 
           if(Array.isArray(right)){
              operations.push(...right);
           }else{
              operations.push(right);
           }           
            return {type:'apply' ,value: operations,delimiter:delimiter,argument:argument,fn:fn,assignment:assignment};
   }else if(argument || assignment || function_call){
     return factor;
   }else{
         throw new SyntaxError(`Unexpected token ${tokens[0]}`);  
   }
}

Interpreter.prototype.evaluate = function (expr,localScope) {
  switch(expr.type) {
      case "value": //number
        return expr.value;
      case "variable":{ //identifier
        if(localScope && expr.name in localScope){ 
              return localScope[expr.name]; 
        }
        if (expr.name in this.vars)
            return this.vars[expr.name];
        else
            throw new ReferenceError(`Undefined variable: ${expr.name}`);
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
          throw new ReferenceError(`Undefined function: ${expr.name}`);
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
     arr=arr.filter(el => el !== true);
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
        if (/^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(token)){
          if(args.find(arg => arg === token)) throw new Error("Declaration includes duplicate variable names");
           args.push(token);      
        }
        else
            throw new SyntaxError("Unexpected syntax: " + token);   
        token = tokens.shift() ;
       
     } 
    fn_operator = token; 
    if(fn_operator !== '=>') throw new SyntaxError("Unexpected syntax: " + save);
    let withFnBody = Array.from(tokens);
    fn_body = this.expression(tokens,false,false,true);
    let funBody = withFnBody.copyWithin(withFnBody.length - tokens.length)
                                         .filter(el => /^[a-zA-z | _ ][a-zA-z | _ | \d]*/.exec(el))
    if(funBody.length > 0) {
        funBody=funBody.filter(el => args.every(arg => arg !== el));
        if(funBody.length !== 0) throw new Error("function's report contains invalid variable names");
    }                                        
    if(fn_name && fn_operator && fn_body){
          let scope ={};
          args.forEach(arg => scope[arg]=undefined);
          this.functions[fn_name] = {args : args , body : fn_body,localScope:scope};
          return "";  
    }else{
          throw new SyntaxError("Unexpected syntax: " + save);  
    }            
}





