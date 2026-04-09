const formatIndianAmount = (amount) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  console.log(formatIndianAmount(567778.9879))