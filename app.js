// BUDGET CONTROLLER
var budgetController = (function() {

    // function constructors
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPerc = function() {
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });
        data.total[type] = sum;
    };

    // data structure
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        total: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }
    
    return {
        addItem: function(type, des, val) {
            
            var newItem, ID;

            // [1 2 3 4 5 6], next ID = 7 
            // [1 2 3 5 6], next ID = 7
            // ID = last ID + 1;
            
            // Create new ID
            if(data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            
            // Create new item based on 'inc' or 'exp' type
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // push into data structure
            data.allItems[type].push(newItem);

            // renturn the new element
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {

            // calculate the total income and budget
            calculateTotal('exp');
            calculateTotal('inc');

            // calculate the budget: income -  expenses
            data.budget = data.total.inc - data.total.exp;

            // calculate the percentage  of the income that we spent
            if(data.total.inc > 0) {
                data.percentage = Math.round((data.total.exp/data.total.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function () {

            data.allItems.exp.forEach(function(current) {
                current.calPercentage(data.total.inc);
            });

        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(current) {
                return current.getPerc();
            });
            return allPerc; 
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalIncome: data.total.inc,
                totalExpenses: data.total.exp,
                percentage: data.percentage
            };
        },

        // only for testing purposes
        testing: function() {
            console.log(data);
        }
    }

})();

// UI CONTROLLER
var UIController = (function() {

    // assigning DOM Strings a varible for future convinance 
    var DOMStrings = {
        // input box
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',

        inputBttn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type) {

        var numSplit, int, dec;
        /*
        + or - before the number
        exactly 2 decimal places
        comma separating the thousands

        2310.255 -> +2,310.26
        2000.00 -> +2,000.00
        */

        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');

        int = numSplit[0];
        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length-3, 3); // input 23150 -> output 23,150
        }

        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;

    };

    // node list does not support forEach so we have to do it manually by creating an forEach function
    var nodeListForEach = function(list, callback) {
        for(var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {

        getInput: function() {

            return {
                type: document.querySelector(DOMStrings.inputType).value, // value is inc or exp
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            }
            
        },

        addListItem: function(obj, type) {

            var html, newHtml, element;

            // Create HTML strings  with place holder text
            if(type === 'inc') {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if(type === 'exp') {
                element = DOMStrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            // Replace place holder text wwith actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(selectorID) {
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element);
        },

        clearFields: function() {
            var fields, fieldsArr;

            // selecting deescription and value box and storing selection in fields variable, field variable is a list type data structure
            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
            // to convert fields(list) into a array, we use call method on Array
            fieldsArr = Array.prototype.slice.call(fields);
            // for each
            fieldsArr.forEach(function(current, index, array) {
                current.value="";
            });
            // change focus to description box
            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalIncome, 'inc');
            document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(obj.totalExpenses, 'exp');
            

            if(obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }
        },

        displayPercentages: function(percentages) {
           
            var fileds = document.querySelectorAll(DOMStrings.expensesPercLabel); // returns node list

            nodeListForEach(fileds, function(current,index) {
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },

        displayMonth: function() {
            var now, year, month, months;

            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August','September', 'October', 'November', 'December'];

            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ', ' +year;
        },

        changedType: function() {

            var fields = document.querySelectorAll(
                DOMStrings.inputType + ',' +
                DOMStrings.inputDescription + ',' +
                DOMStrings.inputValue
                );
            
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus')
            });

            document.querySelector(DOMStrings.inputBttn).classList.toggle('red');
        },

        getDOMStrings: function() {
            return DOMStrings;
        }

    }

})();

// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl) {

    // All event linsters 
    var setupEventListners = function() {
        
        // accessing DOMStrings object in UIController 
        var DOMStrings = UICtrl.getDOMStrings();

        // adding event linstener to enter  key and OK bttn
        document.querySelector(DOMStrings.inputBttn).addEventListener('click', ctrlAddItem);

        // When ENTER key is pressed
        document.addEventListener('keypress', function(event) {

        if(event.keyCode === 13 || event.which === 13) {
            ctrlAddItem();
        }
        });

        document.querySelector(DOMStrings.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOMStrings.inputType).addEventListener('change', UICtrl.changedType);
    };

    var updateBudget = function() {
        
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the duget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {

        // 1. Calculate the percentage
        budgetCtrl.calculatePercentages();

        // 2. Read the percentage from budget controller
        var percentages = budgetCtrl.getPercentages();

        // 3. Update the Ui with new percentages
        UICtrl.displayPercentages(percentages);


    };

    var ctrlAddItem = function() {

        var input, newItem;

        // 1. Get field the input data
        input = UICtrl.getInput();

        if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
        
            // 2. Add the item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            UICtrl.clearFields();

            // 5. Update and display the budget
            updateBudget();

            // 6. Calculate and update the percentages
            updatePercentages();
        }
        
    };

    var ctrlDeleteItem = function (event) {

        var itemID, splitItem, type, ID;
        // Event delegation using event bubbling
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; // (.parentNode()) is used for DOM travesal
        
        if(itemID) {

            //inc-1
            splitItem = itemID.split('-');
            type = splitItem[0];
            ID = parseInt(splitItem[1]);

            // 1. delete the item from data structure
            budgetCtrl.deleteItem(type, ID);

            // 2. delete the item from UI
            UICtrl.deleteListItem(itemID);

            // 3. update and show the new budget
            updateBudget();

            // 4. Calculate and update the percentages
            updatePercentages();
        }

    };

    return {
        // initialization of private functions
        init: function() {
            setupEventListners();
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalIncome: 0,
                totalExpenses: 0,
                percentage: -1
            });
        }
    }


})(budgetController, UIController);

controller.init();