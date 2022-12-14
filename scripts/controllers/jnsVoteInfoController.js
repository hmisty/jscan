angular.module('ethExplorer')
	.controller('jnsVoteInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		$scope.voteFor = function (proposal)
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);

				jnsvote_contract.voteFor.estimateGas(proposal, function (error, gas_amount) {
					if (error) {
						console.log('voteFor estimateGas error: ', error);
						$scope.errmsg = error.data.message;
						$scope.$apply();
					} else {
						console.log('voteFor estimateGas: ', gas_amount);

						jnsvote_contract.voteFor(proposal,
							function (err, result) {
								if (err) {
									console.log('voteFor error: ', err);
									$scope.errmsg = err.message;
									$scope.$apply();
								}
							}); // no need to send()
					}

				});

			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteForCalldata[proposal] + ' 投赞成票';
			}

		}

		$scope.voteAgainst = function (proposal)
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);

				jnsvote_contract.voteAgainst.estimateGas(proposal, function (error, gas_amount) {
					if (error) {
						console.log('voteAgainst estimateGas error: ', error);
						$scope.errmsg = error.data.message;
						$scope.$apply();
					} else {
						console.log('voteAgainst estimateGas: ', gas_amount);

						jnsvote_contract.voteAgainst(proposal,
							function (err, result) {
								if (err) {
									console.log('voteAgainst error: ', err);
									$scope.errmsg = err.message;
									$scope.$apply();
								}
							}); // no need to send()
					}

				});

			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteAgainstCalldata[proposal] + ' 投反对票';
			}

		}

		$scope.init = function()
		{
			getAllProposals();

			if (window.ethereum) {
				// in metamask env
				$scope.chainId = window.ethereum.chainId; 
				console.log('[jns] chain id: ', $scope.chainId);

				$scope.account = window.ethereum.selectedAddress;
				console.log('[jns] connected account: ', $scope.account);

				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[jns] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					console.log("[jns] switched to account: ", accounts[0]);
					$scope.account = accounts[0];
					$scope.$apply();
				});

			} /*else {
				$location.path("/");
			}*/

			function getAllProposals() {
				$scope.allProposals = [];
				$scope.voteForCalldata = {};
				$scope.voteAgainstCalldata = {};

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);
				jnsvote_contract._totalProposals.call(function (err, result) {
						if (err) {
							console.log(err);
							alert('出错啦：' + err.message);
						} else {
							$scope.countProposals = result.toString();

							var gen_callback2 = function (id) {
								return function (err2, result2) {
									if (err2) {
										console.log(err2);
										alert('出错啦：' + err2.message);
									} else {
										var info = {
											id: id,
											title: result2[0],
											link: result2[1],
											timeBegin: result2[2].toString(),
											timeEnd: result2[3].toString(),
											countVotesFor: result2[4].toString() + " (" + (result2[4] == 0 ? "0" : Math.floor(result2[4]/(result2[4].add(result2[5]))*10000)/100) + "%)",

											countVotesAgainst: result2[5].toString() + " (" + (result2[5] == 0 ? "0" : Math.floor(result2[5]/(result2[4].add(result2[5]))*10000)/100) + "%)",

											countJNSvoted: result2[6].toString() + " (" + (result2[6] == 0 ? "0" : Math.floor(result2[6].div(result2[8])*10000)/100) + "%)",
											countJNSvotedFor: result2[7].toString() + " (" + (result2[7] == 0 ? "0" : Math.floor(result2[7].div(result2[8])*10000)/100) + "%)",

											totalJNS: result2[8].toString(),
											disabled: result2[9],
										};

										//$scope.allProposals.push(info);
										var j = 0;
										while (j < $scope.allProposals.length && info.id < $scope.allProposals[j].id) {
											j++;
										}
										$scope.allProposals.splice(j, 0, info);

										$scope.$apply(); // trigger update
									}
								};

							};

							for (var i = 0; i < $scope.countProposals; i++) {
								var pid = i + 1;
								$scope.voteForCalldata[pid] = jnsvote_contract.voteFor.getData(pid);
								$scope.voteAgainstCalldata[pid] = jnsvote_contract.voteAgainst.getData(pid);
								// fetch data from blockchain
								jnsvote_contract._proposals.call(pid, gen_callback2(pid));
							}

						}
					});

			}

		}

		$scope.init();


		function hex2a(hexx) {
			var hex = hexx.toString();//force conversion
			var str = '';
			for (var i = 0; i < hex.length; i += 2)
				str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
			return str;
		}

		function parseTokenURI(tokenURI) {
			var [t, s] = tokenURI.split(',');
			if (t == 'data:application/json;base64') {
				var metadata = JSON.parse(atob(s));
				/*var [t2, s2] = metadata.image.split(',');
				if (t2 == 'data:image/svg+xml;base64') {
					var svg = atob(s2);
					metadata.image = svg;
				}*/
				return metadata;
			}
			return null;
		}

	});
