function filter (options) {
    var firstName = options.record.Name.split(' ').slice(0 , 1).join(' '); 
    var lastName = options.record.Name.split(' ').slice(1).join(' ');
    var fname_lname = {
      "fname" : firstName,
      "lname" : lastName
    }
    options.record.flname = fname_lname;
    return options
}