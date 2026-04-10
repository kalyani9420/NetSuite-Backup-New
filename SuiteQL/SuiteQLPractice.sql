-- Transaction type
-- CardChrg
-- CashSale
-- CustCred
-- CustInvc
-- CustPymt
-- CustRfnd
-- Deposit
-- Estimate
-- ExpRept
-- FxReval
-- InvAdjst
-- InvTrnfr
-- InvWksht
-- ItemRcpt
-- ItemShip
-- Journal
-- Opprtnty
-- PurchOrd
-- RevArrng
-- RtnAuth
-- SalesOrd
-- TrnfrOrd
-- VendAuth
-- VendBill
-- VendCred
-- VendPymt


SELECT DISTINCT type
FROM transaction
ORDER BY type;

SELECT
        BUILTIN.DF( Transaction.Type ) AS TransactionType,
        BUILTIN.DF( Account.AcctType ) AS AccountType,
        Account.DisplayNameWithHierarchy AS AccountHierarchy,
        TransactionAccountingLine.Posting,
        SUM( TransactionAccountingLine.Debit ) AS Debits,
        SUM( TransactionAccountingLine.Credit ) AS Credits,
        SUM( TransactionAccountingLine.Amount ) AS Amount
    FROM 
        Transaction
        INNER JOIN TransactionAccountingLine ON
            ( TransactionAccountingLine.Transaction = Transaction.ID )
        INNER JOIN Account ON
            ( Account.ID = TransactionAccountingLine.Account )
    WHERE
        ( Transaction.TranDate >= BUILTIN.RELATIVE_RANGES( 'DAGO30', 'START' ) )
    GROUP BY
        BUILTIN.DF( Transaction.Type ),
        BUILTIN.DF( Account.AcctType ),
        Account.DisplayNameWithHierarchy,
        TransactionAccountingLine.Posting
    ORDER BY
        TransactionType,
        AccountType,
        DisplayNameWithHierarchy,
        TransactionAccountingLine.Posting
    


SELECT 
    trandisplayname, 
    createddate ,
    BUILTIN.DF(entity) as Customer , 
    BUILTIN.DF(subsidiary) as Subsidiary , 
    Item.item AS Item
    Item.price AS Price
FROM 
    Transaction 
    INNER JOIN Item ON ( Item.Transaction = Transaction.ID )
WHERE ( type = 'SalesOrd' AND id = '22037' )



SELECT 
    trandisplayname, 
    createddate ,
    BUILTIN.DF(entity) as Customer , 
    BUILTIN.DF(subsidiary) as Subsidiary , 
    Item.item AS Item
    Item.price AS Price
FROM 
    Transaction 
    INNER JOIN Item ON ( Item.Transaction = Transaction.ID )
WHERE ( type = 'SalesOrd' AND id = '22037' )

SELECT 
    Transaction.trandisplayname, 
    Transaction.createddate ,
    BUILTIN.DF(Transaction.entity) as Customer , 
    Item.item AS Item
FROM 
    Transaction 
    JOIN Item ON ( Item.Transaction = Transaction.ID )
WHERE ( Transaction.ID = '22037' )




SELECT
    BUILTIN.DF(SalesOrder.entity) as Customer , 
    Item.ItemID,
    Item.Description,
FROM
    Transaction AS SalesOrder
    INNER JOIN TransactionLine AS SOLine ON
        ( SOLine.Transaction = SalesOrder.ID )
        AND ( SOLine.MainLine = 'F' )
    INNER JOIN Item ON
        ( Item.ID = SOLine.Item )                      
WHERE
    ( SalesOrder.Type = 'SalesOrd' )
    AND ( SalesOrder.Void = 'F' )
    AND ( SalesOrder.Voided = 'F' )
    AND (SalesOrder.Id = '22037' )
GROUP BY
    ItemID,
    Description
ORDER BY
    ItemID

    
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

SELECT *  FROM customer WHERE ( companyname = 'France Systems' )

SELECT * FROM customer WHERE companyname LIKE 'F%'

SELECT * FROM customer WHERE companyname LIKE '%Systems%'

SELECT trandisplayname, createddate FROM Transaction WHERE ( type = 'SalesOrd' AND createddate >= '1/1/2026')

SELECT trandisplayname, createddate FROM Transaction WHERE ( type = 'SalesOrd' AND (tranDate <= '3/31/2026' AND tranDate >= '7/1/2025' ))

SELECT trandisplayname, createddate FROM Transaction WHERE ( type = 'SalesOrd' AND entity = '3')

SELECT trandisplayname, createddate FROM Transaction WHERE ( type = 'SalesOrd' AND BUILTIN.DF(entity) LIKE '%Ho%')

// SELECT trandisplayname, createddate FROM Transaction WHERE ( type = 'Invoice' AND account = '6')



SELECT  
   SO.tranid AS Transaction_Id, 
   SO.trandate AS Transaction_Date, 
   BUILTIN.DF(Cust.fullName) AS Customer_Name 
FROM  
   Transaction AS SO
   INNER JOIN customer AS Cust ON SO.entity = Cust.id 
WHERE ( SO.type = 'SalesOrd' AND Cust.Subsidiary = '1' )




SELECT  
   SO.tranid AS Transaction_Id, 
   SO.trandate AS Transaction_Date, 
   BUILTIN.DF(Cust.fullName) AS Customer_Name,
   BUILTIN.DF(subsidiary) AS Subsidiary_Name
FROM  
   Transaction AS SO
   INNER JOIN customer AS Cust ON SO.entity = Cust.id 
WHERE ( SO.type = 'SalesOrd')

          

SELECT  
   tranid AS Transaction_Id, 
   trandate AS Transaction_Date, 
   BUILTIN.DF(fullName) AS Customer_Name,
   BUILTIN.DF(subsidiary) AS Subsidiary_Name
FROM  
   Transaction AS SO
   INNER JOIN customer AS Cust ON SO.entity = Cust.id 
WHERE ( SO.type = 'SalesOrd' AND BUILTIN.DF(subsidiary) LIKE '%Company%')



SELECT  
    companyname AS Customer_Name,
    firstsaledate AS First_Sales_Date,
    sub.fullName AS Subsidiary_Name
 FROM 
    customer AS cust 
    INNER JOIN subsidiary As sub ON cust.subsidiary = sub.id
WHERE companyname LIKE '%Systems%'



SELECT  
    companyname AS Customer_Name,
    firstsaledate AS First_Sales_Date,
    sub.fullName AS Subsidiary_Name
 FROM 
    customer AS cust 
    INNER JOIN subsidiary As sub ON cust.subsidiary = sub.id
WHERE sub.fullName LIKE '%Australia%'




SELECT  
   tranid AS Transaction_Id, 
   trandate AS Transaction_Date, 
   BUILTIN.DF(Cust.fullName) AS Customer_Name,
   BUILTIN.DF(Cust.subsidiary) AS Subsidiary_Name,
   BUILTIN.DF(SOLine.item) AS Item_Name,
   BUILTIN.DF(SOLine.netAmount) AS Item_Amount,
FROM  
   Transaction AS SO
   INNER JOIN customer AS Cust ON SO.entity = Cust.id 
   INNER JOIN TransactionLine AS SOLine ON ( SOLine.Transaction = SO.ID ) AND ( SOLine.MainLine = 'F' )
WHERE ( SO.type = 'SalesOrd' AND SO.Id = '22035' )



SELECT  
   tranid AS Transaction_Id, 
   trandate AS Transaction_Date, 
   BUILTIN.DF(Cust.fullName) AS Customer_Name,
   BUILTIN.DF(Cust.subsidiary) AS Subsidiary_Name,
   BUILTIN.DF(SOLine.item) AS Item_Name,
   BUILTIN.DF(SOLine.rate) AS Item_Rate,
   BUILTIN.DF(SOLine.quantity) AS Item_Qty,
   BUILTIN.DF(SOLine.taxCode) AS Tax_Code,
   BUILTIN.DF(SOLine.taxRate1) AS Tax_Rate,
   BUILTIN.DF(SOLine.tax1Amt) AS Tax_Amount,
   CASE WHEN SOLine.netamount < 0 THEN SOLine.netamount * -1 ELSE SOLine.netamount END AS Item_Amount
FROM  
   Transaction AS SO
   INNER JOIN customer AS Cust ON SO.entity = Cust.id 
   INNER JOIN TransactionLine AS SOLine ON ( SOLine.Transaction = SO.ID ) AND ( SOLine.MainLine = 'F' )
WHERE ( SO.type = 'SalesOrd' AND SO.Id = '22037' AND (BUILTIN.DF(SOLine.item) <> '-Not Taxable-') )




SELECT
    tranId AS Transaction_Id, 
    tranDate AS Transaction_Date, 
FROM
    Transaction AS JE
WHERE (JE.type = 'Journal')
 

SELECT
    Transaction.ID,
    Transaction.TranID AS DocumentNumber,
    Transaction.TranDate,
    AccountingPeriod.PeriodName AS PostingPeriod,  
    Entity.EntityID,
    Transaction.Memo,
    BUILTIN.DF( TransactionAccountingLine.Account ) AS Account,
    TransactionAccountingLine.Debit,
    TransactionAccountingLine.Credit,
    BUILTIN.DF( TransactionLine.Subsidiary ) AS Subsidiary,
    BUILTIN.DF( TransactionLine.Location ) AS Location,
    BUILTIN.DF( TransactionLine.Department ) AS Department,
    BUILTIN.DF( TransactionLine.Class ) AS Class
FROM
    Transaction
    INNER JOIN AccountingPeriod ON
        ( AccountingPeriod.ID = Transaction.PostingPeriod )
    LEFT OUTER JOIN Entity ON
        ( Entity.ID = Transaction.Entity )
    INNER JOIN TransactionAccountingLine ON
        ( TransactionAccountingLine.Transaction = Transaction.ID )  
    INNER JOIN TransactionLine ON
        ( TransactionLine.Transaction = Transaction.ID )    
        AND ( TransactionLine.MainLine = 'T' )
        AND ( TransactionLine.LineSequenceNumber = 0 )
WHERE
    ( Transaction.Type = 'Journal' )
    AND ( Transaction.Voided = 'F' )
    AND ( Transaction.Void = 'F' )
ORDER BY
    DocumentNumber
        


SELECT
    Transaction.ID,
    Transaction.TranID AS DocumentNumber,
    Transaction.TranDate,
    AccountingPeriod.PeriodName AS PostingPeriod,  
    Entity.EntityID,
    Transaction.Memo,
    BUILTIN.DF( TransactionAccountingLine.Account ) AS Account,
    TransactionAccountingLine.Debit,
    TransactionAccountingLine.Credit,
    BUILTIN.DF( TransactionLine.Subsidiary ) AS Subsidiary,
    BUILTIN.DF( TransactionLine.Location ) AS Location,
    BUILTIN.DF( TransactionLine.Department ) AS Department,
    BUILTIN.DF( TransactionLine.Class ) AS Class
FROM
    Transaction
    INNER JOIN AccountingPeriod ON
        ( AccountingPeriod.ID = Transaction.PostingPeriod )
    LEFT OUTER JOIN Entity ON
        ( Entity.ID = Transaction.Entity )
    INNER JOIN TransactionAccountingLine ON
        ( TransactionAccountingLine.Transaction = Transaction.ID )  
    INNER JOIN TransactionLine ON
        ( TransactionLine.Transaction = Transaction.ID )    
        AND ( TransactionLine.MainLine = 'T' )
        AND ( TransactionLine.LineSequenceNumber = 0 )
WHERE
    ( Transaction.Type = 'Journal' )
    AND ( Transaction.Voided = 'F' )
    AND ( Transaction.Void = 'F' )
ORDER BY
    DocumentNumber



SELECT 
BUILTIN.DF(entity) AS Customer_Name,
trandisplayname AS Payment_No,
total AS Payment_Amount
FROM 
Transaction
INNER JOIN TransactionAccountingLine ON ( TransactionAccountingLine.Transaction = Transaction.ID )   
WHERE (type = 'CustPymt')



SELECT 
*
FROM 
Transaction
INNER JOIN TransactionLine ON ( TransactionLine.Transaction = Transaction.ID )
WHERE (type = 'CustPymt')



SELECT 
BUILTIN.DF(trans.entity) AS Customer_Name,
trandisplayname AS Payment_No,
total AS Payment_Amount,
Account AS acc_name
FROM 
Transaction AS trans
INNER JOIN TransactionLine ON ( TransactionLine.Transaction = trans.ID )
WHERE (type = 'CustPymt' AND trans.ID = '20926')



SELECT 
BUILTIN.DF(trans.entity) AS Customer_Name,
trans.trandisplayname AS Payment_No,
trans.total AS Payment_Amount,
Account.fullName AS acc_Name
FROM 
Transaction AS trans
INNER JOIN TransactionLine ON ( TransactionLine.Transaction = trans.ID )
INNER JOIN Account ON ( Account.ID = TransactionLine.expenseaccount )
WHERE (type = 'CustPymt' AND trans.ID = '20926' AND TransactionLine.MainLine = 'F')



SELECT 
*
FROM 
Transaction AS trans
INNER JOIN TransactionLine ON ( TransactionLine.Transaction = trans.ID )
INNER JOIN Account ON ( Account.ID = TransactionLine.expenseaccount )
INNEr JOIN CustomerPaymentApplyLine ON ON ( CustomerPaymentApplyLine.Transaction = trans.ID )
INNEr JOIN customerPayment ON ON ( customerPayment.Transaction = trans.ID )
WHERE (type = 'CustPymt' AND trans.ID = '20926')


SELECT 
*
FROM 
Transaction AS trans
INNEr JOIN CustomerPaymentApplyLine ON ON ( CustomerPaymentApplyLine.Transaction = trans.ID )
WHERE (type = 'CustPymt' AND trans.ID = '20926')