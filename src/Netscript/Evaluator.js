/* Evaluator
 * 	Evaluates the Abstract Syntax Tree for Netscript
 *  generated by the Parser class
 */
// Evaluator should return a Promise, so that any call to evaluate() can just
//wait for that promise to finish before continuing
function evaluate(exp, workerScript) {
	var env = workerScript.env;
    switch (exp.type) {
		case "num":
		case "str":
		case "bool":
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				resolve(exp.value);
			});
			break;
		case "var":
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				resolve(env.get(exp.value));
			});
			break;
		//Can currently only assign to "var"s
		case "assign":
			console.log("Evaluating assign operation");
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				if (exp.left.type != "var")
					throw new Error("Cannot assign to " + JSON.stringify(exp.left));
				
				var p = new Promise(function(resolve, reject) {
					setTimeout(function() { 
						var expRightPromise = evaluate(exp.right, workerScript);
						expRightPromise.then(function(expRight) {
							resolve(expRight);
						}, function() {
							reject("Stopping script");
						});
					}, CONSTANTS.CodeInstructionRunTime)
				});
				
				p.then(function(expRight) {
					console.log("Right side of assign operation resolved with value: " + expRight);
					env.set(exp.left.value, expRight);
					console.log("Assign operation finished");
					resolve("assignFinished");
				}, function() {
					reject("Stopping script");
				});
			});
			
		case "binary":
			console.log("Binary operation called");
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				var pLeft = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var promise = evaluate(exp.left, workerScript);
						promise.then(function(valLeft) {
							resolve(valLeft);
						}, function() {
							reject("Stopping script");
						});
					}, CONSTANTS.CodeInstructionRunTime);
				});
			
				pLeft.then(function(valLeft) {
					var pRight = new Promise(function(resolve, reject) {
						setTimeout(function() {
							var promise = evaluate(exp.right, workerScript);
							promise.then(function(valRight) {
								resolve([valLeft, valRight]);
							}, function() {
								reject("Stopping script");
							});
						}, CONSTANTS.CodeInstructionRunTime);
					});
				
					pRight.then(function(args) {
						console.log("Resolving binary operation");
						resolve(apply_op(exp.operator, args[0], args[1]));
					}, function() {
						reject("Stopping script");
					});
				}, function() {
					reject("Stopping script");
				});
			});
			break;

		//TODO
		case "if":
			var numConds = exp.cond.length;
			var numThens = exp.then.length;
			if (numConds == 0 || numThens == 0 || numConds != numThens) {
				throw new Error ("Number of conds and thens in if structure don't match (or there are none)");
			}
			
			for (var i = 0; i < numConds; i++) {
				var cond = evaluate(exp.cond[i], workerScript);
				if (cond) return evaluate(exp.then[i], workerScript);
			}
			
			//Evaluate else if it exists, snce none of the conditionals
			//were true
			return exp.else ? evaluate(exp.else, workerScript) : false;
				
		case "for":
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				console.log("for loop encountered in evaluator");
				var pInit = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var resInit = evaluate(exp.init, workerScript);
						resInit.then(function(foo) {
							resolve(resInit);
						}, function() {
							reject("Stopping script");
						});
					}, CONSTANTS.CodeInstructionRunTime);
				});

				pInit.then(function(expInit) {
					var pForLoop = evaluateFor(exp, workerScript);
					pForLoop.then(function(forLoopRes) {
						resolve("forLoopDone");
					}, function() {
						reject("Stopping script");
					});
				}, function() {
					reject("Stopping script");
				});
			});
			break;
		case "while":
			console.log("Evaluating while loop");
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				var pEvaluateWhile = evaluateWhile(exp, workerScript);
				pEvaluateWhile.then(function(whileLoopRes) {
					resolve("whileLoopDone");
				}, function() {
					reject("Stopping script");
				});
			});
			break;
		case "prog":
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				var evaluateProgPromise = evaluateProg(exp, workerScript, 0);
				evaluateProgPromise.then(function(res) {
					resolve(res);
				}, function() {
					reject("Stopping script");
				});
			});
			break;

		/* Currently supported function calls:
		 * 		hack()
		 *		sleep(N) - sleep N seconds
		 *		print(x) - Prints a variable or constant
		 *
		 */
		case "call":
			//Define only valid function calls here, like hack() and stuff
			//var func = evaluate(exp.func, env);
			//return func.apply(null, exp.args.map(function(arg){
			//	return evaluate(arg, env);
			//}));
			return new Promise(function(resolve, reject) {
				if (env.stopFlag) {reject("Stopping script");}
				
				setTimeout(function() {
					if (exp.func.value == "hack") {
						console.log("Execute hack()");
						if (exp.args.length != 0) {
							throw new Error("Hack() call has incorrect number of arguments. Takes no arguments");)
						}
						
						var p = new Promise(function(resolve, reject) {
							setTimeout(function() {
								var hackChance = Player.calculateHackingChance();
								var rand = Math.random();
								var expGainedOnSuccess = Player.calculateExpGain();
								var expGainedOnFailure = Math.round(expGainedOnSuccess / 4);
								if (rand < hackChance) {	//Success!
									var moneyGained = Player.calculatePercentMoneyHacked();
									moneyGained = Math.floor(Player.getCurrentServer().moneyAvailable * moneyGained);
									
									Player.getCurrentServer().moneyAvailable -= moneyGained;
									Player.money += moneyGained;
									
									Player.hacking_exp += expGainedOnSuccess;
								} else {			
									//Player only gains 25% exp for failure? TODO Can change this later to balance
									Player.hacking_exp += expGainedOnFailure;
								}
							}, CONSTANTS.CodeInstructionRunTime);
						});
						
						p.then(function(res) {
							resolve("hackExecuted");
						});
						
					} else if (exp.func.value == "sleep") {
						console.log("Execute sleep()");
						if (exp.args.length != 1) {
							throw new Error("Sleep() call has incorrect number of arguments. Takes 1 argument.");
						}
						
						var p = new Promise(function(resolve, reject) {
							setTimeout(function() {
								resolve("foo");
							}, exp.args[0]);
						});
						
						p.then(function(res) {
							resolve("sleepExecuted");
						});
						
					} else if (exp.func.value == "print") {
						if (exp.args.length != 1) {
							throw new Error("Print() call has incorrect number of arguments. Takes 1 argument");
						}
						
						var p = new Promise(function(resolve, reject) {
							setTimeout(function() {
								var evaluatePromise = evaluate(exp.args[0], workerScript);
								evaluatePromise.then(function(res) {
									resolve(res);
								}, function() {
									reject("Stopping script");
								});
							}, CONSTANTS.CodeInstructionRunTime);
						});
					
						p.then(function(res) {
							post(res.toString());
							console.log("Print call executed");
							resolve("printExecuted");
						}, function() {
							reject("Stopping script");
						});
					}
				}, CONSTANTS.CodeInstructionRunTime);
			});
			break;

		default:
			throw new Error("I don't know how to evaluate " + exp.type);
    }
}

//Evaluate the looping part of a for loop (Initialization block is NOT done in here)
function evaluateFor(exp, workerScript) {
	console.log("evaluateFor() called");
	return new Promise(function(resolve, reject) {
		var pCond = new Promise(function(resolve, reject) {
			setTimeout(function() {
				var evaluatePromise = evaluate(exp.cond, workerScript);
				evaluatePromise.then(function(resCond) {
					console.log("Conditional evaluated to: " + resCond);
					resolve(resCond);
				}, function() {
					reject("Stopping script");
				});
			}, CONSTANTS.CodeInstructionRunTime);
		});
		
		pCond.then(function(resCond) {
			if (resCond) {
				console.log("About to evaluate an iteration of for loop code");
				//Run the for loop code
				var pCode = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var evaluatePromise = evaluate(exp.code, workerScript);
						evaluatePromise.then(function(resCode) {
							console.log("Evaluated an iteration of for loop code");
							resolve(resCode);
						}, function() {
							reject("Stopping script");
						});
					}, CONSTANTS.CodeInstructionRunTime);
				});
				
				//After the code executes make a recursive call
				pCode.then(function(resCode) {
					var pPostLoop = new Promise(function(resolve, reject) {
						setTimeout(function() {
							var evaluatePromise = evaluate(exp.postloop, workerScript);
							evaluatePromise.then(function(foo) {
								console.log("Evaluated for loop postloop");
								resolve("postLoopFinished");
							}, function() {
								reject("Stopping script");
							});
						}, CONSTANTS.CodeInstructionRunTime);
					});
					
					pPostLoop.then(function(resPostloop) {
						var recursiveCall = evaluateFor(exp, workerScript);
						recursiveCall.then(function(foo) {
							resolve("endForLoop");
						}, function() {
							reject("Stopping script");
						});
					}, function() {
						reject("Stopping script");
					});

				}, function() {
					reject("Stopping script");
				});
			} else {
				console.log("Cond is false, stopping for loop");
				resolve("endForLoop");	//Doesn't need to resolve to any particular value
			}
		}, function() {
			reject("Stopping script");
		});
	});
}

function evaluateWhile(exp, workerScript) {
	console.log("evaluateWhile() called");
	return new Promise(function(resolve, reject) {
		var pCond = new Promise(function(resolve, reject) {
			setTimeout(function() {
				var evaluatePromise = evaluate(exp.cond, workerScript);
				evaluatePromise.then(function(resCond) {
					console.log("Conditional evaluated to: " + resCond);
					resolve(resCond);
				}, function() {
					reject("Stopping script");	
				});
			}, CONSTANTS.CodeInstructionRunTime);
		});
		
		pCond.then(function(resCond) {
			if (resCond) {
				//Run the while loop code
				var pCode = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var evaluatePromise = evaluate(exp.code, workerScript);
						evaluatePromise.then(function(resCode) {
							console.log("Evaluated an iteration of while loop code");
							resolve(resCode);
						}, function() {
							reject("Stopping script");
						});
					}, CONSTANTS.CodeInstructionRunTime);
				});
				
				//After the code executes make a recursive call
				pCode.then(function(resCode) {
					var recursiveCall = evaluateWhile(exp, workerScript);
					recursiveCall.then(function(foo) {
						resolve("endWhileLoop");
					}, function() {
						reject("Stopping script");
					});
				}, function() {
					reject("Stopping script");
				});
			} else {
				console.log("Cond is false, stopping while loop");
				resolve("endWhileLoop");	//Doesn't need to resolve to any particular value
			}
		}, function() {
			reject("Stopping script");
		});
	});
}

function evaluateProg(exp, workerScript, index) {
	console.log("evaluateProg() called");
	return new Promise(function(resolve, reject) {
		if (index >= exp.prog.length) {
			console.log("Prog done. Resolving recursively");
			resolve("progFinished");
		} else {
			//Evaluate this line of code in the prog
			var code = new Promise(function(resolve, reject) {
				setTimeout(function() {
					var evaluatePromise = evaluate(exp.prog[index], workerScript); 
					evaluatePromise.then(function(evalRes) {
						resolve(evalRes);
					}, function() {
						reject("Stopping script");
					});
				}, CONSTANTS.CodeInstructionRunTime);
			});
			
			//After the code finishes evaluating, evaluate the next line recursively
			code.then(function(codeRes) {
				var nextLine = evaluateProg(exp, workerScript, index + 1);
				nextLine.then(function(nextLineRes) {
					resolve("progDone");
				}, function() {
					reject("Stopping script");
				});
			}, function() {
				reject("Stopping script");
			});
		}
	});
}

function apply_op(op, a, b) {
    function num(x) {
        if (typeof x != "number")
            throw new Error("Expected number but got " + x);
        return x;
    }
    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x;
    }
    switch (op) {
      case "+": return num(a) + num(b);
      case "-": return num(a) - num(b);
      case "*": return num(a) * num(b);
      case "/": return num(a) / div(b);
      case "%": return num(a) % div(b);
      case "&&": return a !== false && b;
      case "||": return a !== false ? a : b;
      case "<": return num(a) < num(b);
      case ">": return num(a) > num(b);
      case "<=": return num(a) <= num(b);
      case ">=": return num(a) >= num(b);
      case "==": return a === b;
      case "!=": return a !== b;
    }
    throw new Error("Can't apply operator " + op);
} 
