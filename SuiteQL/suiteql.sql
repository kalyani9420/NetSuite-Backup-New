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




            /* set operations */
SELECT * FROM transaction UNION SELECT * FROM transaction /* top n */
SELECT TOP 10 * FROM transaction
SELECT TOP 1 id FROM transaction UNION SELECT TOP 1 id FROM transaction /* select list */
SELECT DISTINCT email FROM transaction
SELECT (SELECT MAX(1) FROM transaction) AS one FROM transaction
SELECT COUNT(DISTINCT 1+id) FROM transaction
SELECT COALESCE(email, id, 'some value', 1 + 1) FROM transaction /* from */
SELECT * FROM transaction, transactionLine
SELECT * FROM (SELECT * FROM transaction) a INNER JOIN ((SELECT * FROM transaction UNION SELECT * FROM transaction) b INNER JOIN (SELECT * FROM transaction) c ON 1=1) ON 1=1
SELECT * FROM (SELECT id, COUNT(*) cnt FROM transactionLine GROUP BY id) WHERE cnt > 2 /* where */
SELECT * FROM transaction t WHERE id IN (SELECT id FROM transaction WHERE id = t.id UNION SELECT -1 FROM transaction)
SELECT * FROM transaction WHERE 1 = (SELECT MAX(1) FROM transaction)
SELECT * FROM transaction WHERE EXISTS(SELECT 1 FROM transaction)
SELECT * FROM transaction WHERE id IN ((SELECT MAX(1) FROM transaction), 2+1) /* having */
SELECT email, COUNT(*), MAX(create_date) FROM transaction GROUP BY email HAVING COUNT(*) > 2 






SELECT * FROM (SELECT * FROM transaction)
a INNER JOIN ((SELECT * FROM transaction UNION SELECT * FROM transaction)
b INNER JOIN (SELECT * FROM transaction)
c ON 1=1) ON 1=1





SELECT
	Transaction.TranID,
	Transaction.TranDate,
	BUILTIN.DF( Transaction.Type ) AS Type,
	BUILTIN.DF( Transaction.Status ) AS Status,
	BUILTIN.DF( Transaction.Entity ) AS Entity,
	BUILTIN.DF( Transaction.Employee ) AS Employee,
	BUILTIN.DF( Entity.Type ) AS EntityType,
	BUILTIN.DF( Entity.Phone ) AS EntityPhone,
	Employee.Title AS EmployeeTitle,
	Employee.Phone AS EmployeePhone,	
	Employee.Email AS EmployeeEmail
FROM
	Transaction
	INNER JOIN Entity ON
		( Entity.ID = Transaction.Entity )
	LEFT OUTER JOIN Employee ON
		( Employee.ID = Transaction.Employee )

          
    