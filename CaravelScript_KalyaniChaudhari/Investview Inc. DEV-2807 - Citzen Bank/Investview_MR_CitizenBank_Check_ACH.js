/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
/**
*Description: The Map Reduce script to generate check files in ACH CSV format"
  Script Name: Investview_MR_CitizenBank_Check_ACH.js
  Author: Akanksha Bhardwaj
  Company: Caravel
  Date: 11-03-2024 
  Script Modification Log:
  -- version--     -- Date --         -- Modified By --     --Requested By--      -- Description --
       1.0         11-03-2024         Akanksha Bhardwaj       Habib Abdullahi        Create a Map Reduce script to generate check files in ACH CSV format
*/
define(['N/record', 'N/search', 'N/sftp', 'N/runtime', 'N/file', 'N/format' , 'N/record'],
	(record, search, sftp, runtime, file, format , record) => {

		const getInputData = (inputContext) => {
			var script = runtime.getCurrentScript();
			var account_Number = script.getParameter({ name: 'custscript_account_number_checks_ach' })
			log.debug('account_Number:', account_Number);
			var filterExp = [];

			//MM: 10/20/23 - Adding date filter
			var todaysDate = new Date();
			log.debug('Todays Date', todaysDate);
			//Format today's date
			var full_year_today = todaysDate.getFullYear();
			var month_today = todaysDate.getMonth() + 1;
			var day_today = todaysDate.getDate();
			var formatted_current_date = month_today + '/' + day_today + '/' + full_year_today;
			log.debug("Current_date", formatted_current_date);

			if (account_Number) {
				filterExp.push([
					["trandate", "onorbefore", formatted_current_date],
					"AND",
					["type", "anyof", "Check"],
					"AND",
					["mainline", "is", "T"],
					"AND",
					["accountmain", "anyof", account_Number.split(",")],
					"AND",
					["custbody_cp_vendorbillpaymentmethod", "anyof", "7"],
					"AND",
					["custbody_checkfile_generated", "is", "F"]
				])
			} else {
				filterExp.push([
					["trandate", "onorbefore", formatted_current_date],
					"AND",
					["type", "anyof", "Check"],
					"AND",
					["mainline", "is", "T"],
					"AND",
					["custbody_cp_vendorbillpaymentmethod", "anyof", "7"],
					"AND",
					["custbody_cp_payment_file_gener", "is", "F"]
				],)
			}
			var arr_search_result = new Array();
			var vendorpaymentSearchObj = search.create({
				type: "check",
				filters: filterExp,

				columns:
					[
						search.createColumn({
							name: "formulatext",
							formula: "'HDR'",
							label: "Record type"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "'PAY'",
							label: "Payment Record Type"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "'U'",
							label: "Transaction Handling Code"
						}),
						search.createColumn({ name: "amount", label: "Amount " }),
						search.createColumn({ name: "subsidiary", label: "Subsidiary " }),
						search.createColumn({
							name: "formulatext",
							formula: "'C'",
							label: "Code Handling"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "'SG'",
							label: "Beneficiary Account"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "'USD'",
							label: "Currency code"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "'BEN'",
							label: "Charge code"
						}),
						search.createColumn({ name: "entity", label: "Name" }),
						search.createColumn({ name: "internalid", label: "Internal ID" }),
						search.createColumn({
							name: "address1",
							join: "vendor",
							label: "Address 1"
						}),
						search.createColumn({
							name: "address2",
							join: "vendor",
							label: "Address 2"
						}),
						search.createColumn({
							name: "address3",
							join: "vendor",
							label: "Address 3"
						}),
						search.createColumn({
							name: "city",
							join: "vendor",
							label: "City"
						}),
						search.createColumn({
							name: "country",
							join: "vendor",
							label: "Country"
						}),
						search.createColumn({
							name: "countrycode",
							join: "vendor",
							label: "Country Code"
						}),
						search.createColumn({
							name: "zipcode",
							join: "vendor",
							label: "Zip Code"
						}),
						search.createColumn({
							name: "state",
							join: "vendor",
							label: "State/Province"
						}),
						search.createColumn({ name: "trandate", label: "Date" }),
						search.createColumn({
							name: "transactionnumber",
							join: "appliedToTransaction",
							label: "Transaction Number"
						}),
						search.createColumn({
							name: "formulatext",
							formula: "CASE WHEN {custbody_cp_vendorbillpaymentmethod.id} = 7 THEN {custbody_11187_pref_entity_bank.custrecord_2663_entity_acct_no} ELSE  ({custbody_11187_pref_entity_bank.custrecord_2663_entity_bank_no})  END",
							label: "Bank Number/Account Number"
						}),
						search.createColumn({
							name: "custrecord_2663_entity_acct_no",
							join: "CUSTBODY_11187_PREF_ENTITY_BANK",
							label: "Bank Account Number"
						}),
						search.createColumn({
							name: "custrecord_2663_entity_bank_no",
							join: "CUSTBODY_11187_PREF_ENTITY_BANK",
							label: "Bank Number"
						}),
						search.createColumn({
							name: "custrecord_2663_entity_iban",
							join: "CUSTBODY_11187_PREF_ENTITY_BANK",
							label: "IBAN"
						}),
						search.createColumn({ name: "accountmain", label: "Account (Main)" }),
						search.createColumn({
							name: "internalid",
							join: "vendor",
							label: "Internal ID"
						})
					]
			});

			const resultSet = vendorpaymentSearchObj.run().getRange({ start: 0, end: 100 });
			log.debug({ title: 'Debug Entry', details: '==No of records Length::==' + resultSet.length });
			if (resultSet.length > 0) {
				for (var i = 0; i < resultSet.length; i++) {
					let s_entityid = resultSet[i].getText({ name: "entity", label: "Name" });
					let vendor_id = resultSet[i].getText({ name: "internalid", join: "vendor", label: "Internal ID" });
					let file_control_number = i;
					let f_payment_amt = resultSet[i].getValue({ name: "amount", label: "Amount" });

					//MM - 03/01 - Add Subsidiary for Payer Name PAY041
					let f_subsidiary = resultSet[i].getText({ name: "subsidiary", label: "Subsidiary" });
					log.debug('f_subsidiary', f_subsidiary);

					let d_payment_date = resultSet[i].getValue({ name: "trandate" });
					let payer_add1 = resultSet[i].getValue({ name: "address1", join: "vendor", label: "Address 1" });
					let payer_add2 = resultSet[i].getValue({ name: "address2", join: "vendor", label: "Address 2" });
					let payer_add3 = resultSet[i].getValue({ name: "address3", join: "vendor", label: "Address 3" });
					let payer_city = resultSet[i].getValue({ name: "city", join: "vendor", label: "City" });
					let payer_country = resultSet[i].getValue({ name: "country", join: "vendor", label: "Country" });
					let payer_zip = resultSet[i].getValue({ name: "zipcode", join: "vendor", label: "Zip Code" });
					let payer_state = resultSet[i].getValue({ name: "state", join: "vendor", label: "State/Province" });
					let payer_country_code = resultSet[i].getValue({ name: "countrycode", join: "vendor", label: "Country Code" });
					let i_bill_payment_id = resultSet[i].getValue({ name: "internalid" });
					let Bank_account_number = resultSet[i].getValue({
						name: "formulatext",
						formula: "CASE WHEN {custbody_cp_vendorbillpaymentmethod.id} = 7 THEN {custbody_11187_pref_entity_bank.custrecord_2663_entity_acct_no} ELSE  ({custbody_11187_pref_entity_bank.custrecord_2663_entity_bank_no})  END",
						label: "Bank Number/Account Number"
					});
					log.debug('i_bill_payment_id:==' + i_bill_payment_id);

					let pay_Account_number = resultSet[i].getValue({
						name: "accountmain", label: "Account (Main)"
					});
					log.debug('pay_Account_number:==' + pay_Account_number);

					///////new changes
					log.debug('vendor_id:==' + vendor_id);
					var sec_bank_details_id = "";
					var customrecord_2663_entity_bank_detailsSearchObj = search.create({
						type: "customrecord_2663_entity_bank_details",
						filters:
							[
								["custrecord_2663_parent_vendor", "anyof", vendor_id],
								"AND",
								["custrecord_2663_entity_file_format", "anyof", "13"],
								"AND",
								["custrecord_2663_entity_bank_type", "anyof", "1"]
							],
						columns:
							[
								search.createColumn({ name: "internalid", label: "Internal ID" }),
								search.createColumn({
									name: "name",
									sort: search.Sort.ASC,
									label: "Name"
								})
							]
					});
					var searchResultCount = customrecord_2663_entity_bank_detailsSearchObj.runPaged().count;
					log.debug("customrecord_2663_entity_bank_detailsSearchObj result count", searchResultCount);
					customrecord_2663_entity_bank_detailsSearchObj.run().each(function (result) {
						sec_bank_details_id = result.getValue({ name: "internalid", label: "Internal ID" });
						return true;
					});

					log.debug("sec_bank_details_id", sec_bank_details_id);
					var New_bank_acc_Number = "";
					var bank_acc_Number = "";
					if (sec_bank_details_id)////check added to fix error if no ACH instructions exists on 29th June
					{
						var vendor_bank_rec = record.load({
							type: 'customrecord_2663_entity_bank_details',
							id: sec_bank_details_id,
							isDynamic: true,
						});
						log.debug("vendor_bank_rec", vendor_bank_rec);


						New_bank_acc_Number = vendor_bank_rec.getValue({ fieldId: 'custrecord_2663_entity_acct_no' });
						log.debug("New_bank_acc_Number", New_bank_acc_Number);

						bank_acc_Number = vendor_bank_rec.getValue({ fieldId: 'custrecord_2663_entity_bank_no' });
						log.debug("bank_acc_Number", bank_acc_Number);
					}////check if vendor bank details exists ////check added to fix error if no ACH instructions exists on 29th June
					arr_search_result.push({
						'i_bill_payment_id': i_bill_payment_id,
						'values': {
							's_entityid': s_entityid,
							'file_control_number': file_control_number,
							'batch_number': '0000' + i,
							'f_payment_amt': f_payment_amt,
							'f_subsidiary': f_subsidiary,
							'd_payment_date': d_payment_date,
							'payer_add1': payer_add1,
							'payer_add2': payer_add2,
							'payer_add3': payer_add3,
							'payer_city': payer_city,
							'payer_country': payer_country,
							'payer_zip': payer_zip,
							'payer_state': payer_state,
							'payer_country_code': payer_country_code,
							'Bank_account_number': New_bank_acc_Number,
							'pay_Account_number': pay_Account_number,
							'bank_acc_Number': bank_acc_Number


						}
					});

				}
			}

			let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
			log.debug("Get Input Data Remaining usage", remainingUsage);
			if (resultSet.length > 0) {
				return arr_search_result;
			}
			else {
				return [];
			}

		}

		const map = (mapContext) => {
			var mapContextParse = JSON.parse(mapContext.value)
			log.debug('mapContext.key', JSON.parse(mapContext.key))
			log.debug('mapContext.value', JSON.parse(mapContext.value))
			mapContext.write({ key: 'File_ids', value: mapContextParse });

		}
		const reduce = (reduceContext) => {
			try {

				let lineValue = parseReducedRecords(reduceContext);
				log.debug('lineValue', lineValue);
				log.debug({ title: "Reduce context for key: ${reduceContext.key}", details: reduceContext.values });

				reduceContext.write({ key: 'File_ids', value: reduceContext.values });

				// 	/// 14-02 IC
				let payment_ach_Record = record.load({
					type: 'customrecord_citizen_checks_increment',
					id: 1,
					isDynamic: true
				});
				log.debug("payment_ach_Record", payment_ach_Record);
				let increment_number = parseInt(payment_ach_Record.getValue({ fieldId: 'custrecord_ach_increment_number' }));
				log.debug("increment_number", increment_number);
				let set_increment_number;
				if (increment_number < 10) {
					set_increment_number = "00000000" + increment_number;
				} else if (increment_number < 100) {
					set_increment_number = "0000000" + increment_number;
				} else if (increment_number < 1000) {
					set_increment_number = "000000" + increment_number;
				} else if (increment_number < 10000) {
					set_increment_number = "00000" + increment_number;
				} else if (increment_number < 100000) {
					set_increment_number = "0000" + increment_number;
				}
				log.debug("set_increment_number", set_increment_number);
				// 	   //end of changes
				//// For loop
				var file_contents;
				log.debug('lineValue.length', lineValue.length);
				let Internal_Ids_array = [];
				for (let i = 0; i < lineValue.length; i++) {
					const internalId = lineValue[i].i_bill_payment_id;
					Internal_Ids_array.push(internalId);
					log.debug("internalId", internalId);
					var s_entityid = lineValue[i].values.s_entityid;
					if (s_entityid) {
						//s_entityid = s_entityid.toString().split(',');
					}

					var file_control_number = lineValue[i].values.file_control_number;
					log.debug('s_entityid:==', s_entityid + '==file_control_number:==' + file_control_number);
					if (file_control_number == 0) {
						file_control_number = 1;
					}
					if (file_control_number < 10) {
						file_control_number = "00000000" + file_control_number;
					} else if (file_control_number >= 10 && file_control_number < 100) {
						file_control_number = "0000000" + file_control_number;
					} else if (file_control_number >= 100 && file_control_number < 1000) {
						file_control_number = "000000" + file_control_number;
					}
					log.debug("file_control_number", file_control_number);
					var date = new Date();
					var hourstxt = date.getHours();
					log.debug('hours:==', hourstxt);
					////hourstxt=4;

					if (parseInt(hourstxt) < 10) {

						hourstxt = "0" + hourstxt; //+ String.fromCharCode(8203)

						///hours = '0'+hours;
					}
					var min = date.getMinutes();

					if (parseInt(min) < 10) {
						min = '0' + min;
					}


					//  new changes date
					if (!!date.valueOf()) { // Valid date
						var year = date.getFullYear().toString().slice(-2);
						var full_year = date.getFullYear();
						//var twoDigitYear = year.toString().substr(-2);
						var month = date.getMonth() + 1;
						var day = date.getDate();

					}
					var newtwoDigit_day;
					if (day < 10) {
						newtwoDigit_day = '0' + day;

					} else {
						newtwoDigit_day = day;
					}
					log.debug("newtwoDigit_day", newtwoDigit_day);
					var newtwoDigit_month;
					if (month < 10) {
						newtwoDigit_month = '0' + month;

					} else {
						newtwoDigit_month = month;
					}
					log.debug("newtwoDigit_month", newtwoDigit_month);
					if (newtwoDigit_month == 0) {
						newtwoDigit_month = '01';
					}

					var newDateFormat = year + '' + newtwoDigit_month + '' + newtwoDigit_day;
					log.debug("newDate format", newDateFormat);
					var full_date = full_year + '' + newtwoDigit_month + '' + newtwoDigit_day;
					var Current_date = newtwoDigit_month + '' + newtwoDigit_day + '' + full_year;
					log.debug("Current_date", Current_date);
					date = format.format({ value: date, type: format.Type.DATE });

					var batch_no = lineValue[i].values.batch_number;
					if (batch_no == 0) {
						batch_no = 1;
					}
					var f_payment_amt = lineValue[i].values.f_payment_amt;
					if (f_payment_amt < 0) {
						let setValue = '.00'
						f_payment_amt = parseFloat(f_payment_amt * -1).toFixed(2);
					}
					log.debug("positiv payment", f_payment_amt);

					//MM - 03/01 - Add Subsidiary name for Payer Name in PAY041 field
					var f_subsidiary = lineValue[i].values.f_subsidiary;
					log.debug("f_subsidiary", f_subsidiary);
					if (f_subsidiary) {
						var split_subsidiary = f_subsidiary.split(":");
						log.debug("split_subsidiary", split_subsidiary.length);

						if (split_subsidiary.length > 1) {
							//Second part of the subsidiary name
							f_subsidiary = split_subsidiary[1];
							f_subsidiary = f_subsidiary.trim();
						} else {
							//First part of the name
							f_subsidiary = split_subsidiary[0];
						}
					}

					log.debug("new_f_subsidiary", f_subsidiary);

					const d_payment_date = lineValue[i].values.d_payment_date;
					const payer_add1 = lineValue[i].values.payer_add1;
					const payer_add2 = lineValue[i].values.payer_add2;
					const payer_add3 = lineValue[i].values.payer_add3;
					const payer_city = lineValue[i].values.payer_city;
					const payer_country = lineValue[i].values.payer_country;
					const payer_zip = lineValue[i].values.payer_zip;
					const payer_state = lineValue[i].values.payer_state;
					const payer_country_code = lineValue[i].values.payer_country_code;
					const Bank_account_number = lineValue[i].values.Bank_account_number;
					const pay_Account_number = lineValue[i].values.pay_Account_number;
					const bank_acc_Number = lineValue[i].values.bank_acc_Number;
					log.debug("Bank_account_number", Bank_account_number);
					log.debug("bank_acc_Number", bank_acc_Number);
					if (pay_Account_number) {
						var AccNumber = search.lookupFields({
							type: search.Type.ACCOUNT,
							id: parseInt(pay_Account_number),
							columns: ['custrecord_pay_account_number', 'custrecord_company_id']
						});
						log.debug("AccNumber", AccNumber);
					}

					if (AccNumber.custrecord_pay_account_number) {
						var F_Account_no = AccNumber.custrecord_pay_account_number;
					} else {
						var F_Account_no = "";
					}
					let company_id;
					if (AccNumber.custrecord_company_id) {
						company_id = AccNumber.custrecord_company_id;  // add dynamic company id 20-07-2023
						log.debug("company_id", company_id);
					} else {
						company_id = "";
					}

					const orginator_aba_number = '01'; //+ String.fromCharCode(8203); //////'="01"';  ///////="01"
					if (internalId) {
						if (i == 0) {
							file_contents = 'HDR' + ',' + '"' + 'INVESTVIEWT-CSV' + '"' + ',' + set_increment_number + ',' + newDateFormat + ',' + hourstxt + min + ',' + batch_no + '\r\n';
						}

						//file_contents+='\n';
						file_contents += 'PAY' + ',' + 'C' + ',' + parseFloat(f_payment_amt).toFixed(2) + ',' + 'C' + ',' + 'ACH' + ',' + 'CTX' + ',' + '036076150' + ',' + F_Account_no + ',' + company_id + ',' + orginator_aba_number.toString() + ',' + bank_acc_Number + ',' + 'SG' + ',' + Bank_account_number + ',' + full_date + ',' + ',,,' + ',,,,,,,,,,,,,,,,,,,,,,,' + '"' + f_subsidiary + '"' + ',,,,,,,' + '"' + s_entityid + '"' + ',' + '"' + s_entityid + '"' + ',,' + payer_add1 + ',' + payer_add2 + ',' + payer_city + ',' + payer_state + ',' + payer_zip + ',' + payer_country_code + ',,,,,,' + '\r\n';
						//file_contents+='\n';
						//file_contents += 

						var f_bill_payment_total = 0;
						let i_invoice_no;
						let f_gross_Amt;
						let s_memo;
						let d_invoice_date_New;
						const vendorpaymentSearchObj = search.create({
							type: "check",
							filters:
								[
									["type", "anyof", "Check"],
									"AND",
									["internalid", "anyof", internalId],
									"AND",
									["mainline", "is", "F"]
								],
							columns:
								[
									search.createColumn({ name: "tranid", label: "Document Number" }),
									search.createColumn({ name: "trandate", label: "Date" }),
									search.createColumn({ name: "grossamount", label: "Amount (Gross)" }),
									search.createColumn({ name: "memo", label: "Memo" }),
									search.createColumn({ name: "amount", label: "Amount" })
								]
						});
						var searchResultCount = vendorpaymentSearchObj.runPaged().count;
						log.debug("vendorpaymentSearchObj result count", searchResultCount);
						vendorpaymentSearchObj.run().each(function (result) {

							i_invoice_no = result.getValue({ name: "tranid", label: "Document Number" });
							log.debug("i_invoice_no", i_invoice_no);
							let d_invoice_date = result.getValue({ name: "trandate", label: "Date" });
							log.debug("2nd search d_invoice_date before", d_invoice_date);
							// cahnges 
							var i_invoice_no_date = new Date(d_invoice_date);
							log.debug("2nd search d_invoice_date after format", d_invoice_date);


							if (!!i_invoice_no_date.valueOf()) { // Valid date
								var year = i_invoice_no_date.getFullYear();
								//var twoDigitYear = year.toString().substr(-2);

								var month = i_invoice_no_date.getMonth() + 1;    ////////////////Invoice date month Fix on 29th June


								if (month < 10) {
									month = '0' + month;

								} else {
									month = month;
								}
								log.debug("month=============new===", month);

								var day = i_invoice_no_date.getDate();
								if (day < 10) {
									day = '0' + day;

								} else {
									day = day;
								}
								log.debug("day==================new=========", day);


							}////////////////////end of if ( !!i_invoice_no_date.valueOf() ) 


							d_invoice_date_New = year + '' + month + '' + day;
							log.debug("newDate d_invoice_date_New", d_invoice_date_New);

							s_memo = result.getValue({ name: "memo", label: "Memo" });
							f_gross_Amt = parseFloat(result.getValue({ name: "grossamount", label: "Amount (Gross)" })).toFixed(2);
							log.debug("2nd search f_gross_Amt", f_gross_Amt);
							// let d_discount_amt = result.getValue({name: "discountamount",join: "appliedToTransaction", label: "Amount Discount" });
							let f_total = result.getValue({ name: "amount", label: "Amount" });
							log.debug('f_total:==' + f_total);
							//file_contents+='\n';
							return true;
						});
						file_contents += 'REM' + ',' + 'IV' + ',' + i_invoice_no + ',' + ',' + f_payment_amt + ',' + f_gross_Amt + ',,,' + '' + ',' + i_invoice_no + ',' + d_invoice_date_New + ',,,,' + '\r\n';
					}//end of if(internalId)

				}
				let file_name = 'DSIINV.CX-ACH-' + hourstxt + min + '-' + Current_date;
				let fileObj = file.create({ name: file_name, fileType: file.Type.CSV, contents: file_contents, folder: 749 });
				log.debug('fileObj:==', fileObj);
				let savedId = fileObj.save();
				log.debug('savedId:==', savedId);

				if (savedId) {
					for (let k = 0; k < Internal_Ids_array.length; k++) {

						log.debug("internalId in check box", Internal_Ids_array[k]);
						record.submitFields({
							type: 'check',
							id: Internal_Ids_array[k].toString(),
							values: {
								'custbody_checkfile_generated': true
							}
						});


					}
					var new_increment_number = set_increment_number;
					new_increment_number++;
					var data = new_increment_number;
					log.debug("new_increment_number", new_increment_number);
					log.debug("data", data);
					// payment_ach_Record.setValue({fieldId:'custrecord_file_number',value:data});
					var demo = record.submitFields({
						type: 'customrecord_citizen_checks_increment',
						id: 1,
						values: {
							'custrecord_ach_increment_number': parseInt(data),
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});
					log.debug("demo", demo);
				}
				let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.debug(" reduce Remaining usage", remainingUsage);

			}
			catch (error) {
				log.error({ title: "Caught error in Reduce stage", details: error });
			}
		}

		const summarize = (summaryContext) => {
			var errorMsg = [];
			summaryContext.output.iterator().each(function (key, value) {
				var value = JSON.parse(value);
				log.debug('valuevalue:==', value);
				errorMsg.push(value);
				return true;
			});
			errorMsg = errorMsg.toString().split(',');
			log.debug('errorMsg length:==', errorMsg.length);
		}

		const processFile = (filePath, fileObj, sftpConfigId) => {
			if (sftpConfigId) {
				const {
					custrecord_cp_sftp_url: url,
					custrecord_cp_sftp_key_id: keyId,
					custrecord_cp_sftp_username: username,
					custrecord_cp_sftp_host_key: hostKey,
					custrecord_cp_sftp_port: port,
					custrecord_cp_sftp_password: password
				} = search.lookupFields({
					id: sftpConfigId,
					type: "customrecord_cp_sftp_config",
					columns: ["custrecord_cp_sftp_url", "custrecord_cp_sftp_key_id", "custrecord_cp_sftp_username", "custrecord_cp_sftp_host_key", "custrecord_cp_sftp_port", "custrecord_cp_sftp_password"]
				});

				try {
					sftpConnection = sftp.createConnection({
						keyId: keyId,
						username: username,
						url: url,
						hostKey: hostKey,
						passwordGuid: password,
						port: parseInt(port)
					});
					log.debug("sftpConnection", sftpConnection);

					try {
						sftpConnection.upload({
							file: fileObj,
							directory: filePath
						});

						return {
							success: true,
							time: new Date(),
							error: null
						}
					}
					catch (error) {
						log.error({ title: "Error uploading file", details: error });

						return {
							success: false,
							time: null,
							error: error
						}
					}
				}
				catch (error) {
					log.error({ title: "Error Connecting to FTP", details: error });
					return {
						success: false,
						time: null,
						error: error
					}
				}
			}
			else {
				return {
					success: false,
					time: null,
					error: "No SFTP, not uploaded"
				}
			}
		}
		function parseReducedRecords(reduceContext) {
			let reduceContextParse = []; let count = 0;
			for (let j = 0; j < reduceContext.values.length; j++) {
				let parsedObject = JSON.parse(reduceContext.values[j]);
				reduceContextParse.push(parsedObject);
			} return reduceContextParse;
		}
		return { getInputData, map, reduce, summarize }

	});