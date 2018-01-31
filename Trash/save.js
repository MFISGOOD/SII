Interpreter.prototype._expression2 = function(tokens){
   if (tokens.length === 0 ) return null;
   let factor = this.factor(tokens);
   let token,match ;
   let operations=[];
   operations.push(factor);
   if(tokens.length === 0 || tokens[0] === ')')
            return operations;
   else if(match = /[ + | \- | \/ | * | %]/.exec( token = tokens.shift())){
            operations.push(match[0]);
            let right = this._expression(tokens);
            right = typeof(right) === 'object' && 'value' in right ? right.value : right;
            operations.push(...right);
            if(tokens.length > 1 && tokens[0] !== ')') throw new SyntaxError(`Unexpected token ${tokens.join(' ')}`)
            return {type:'apply' ,value: operations};
   }            
            // return {type : 'appy', value:[factor, match[0] ,this.expression(tokens).value]} 
  else{
   	        // tokens.unshift(token);
   	        // return operations;
   	         throw new SyntaxError("Unexpected syntax: " + token);
   } 
        
}

Interpreter.prototype.expression = function(tokens){
   let factor = this.factor(tokens);
   let token,match ;
   if(tokens.length === 0 || tokens[0] === ')')
      return factor;
   else if(match = /[ + | \- | \/ | * | %]/.exec( token = tokens.shift()))
                return {type : 'apply',operator: match[0] ,left : factor, right : this.expression(tokens)};      
            // return {type : 'appy', value:[factor, match[0] ,this.expression(tokens).value]} 

   else 
         throw new SyntaxError("Unexpected syntax: " + token);
}