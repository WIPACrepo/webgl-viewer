/**
 * Class for creating csv strings
 * Handles multiple data types
 * Objects are cast to Strings
 **/

csvWriter = function(del, enc) {
    this.del = del || ','; // CSV Delimiter
    this.enc = enc || '"'; // CSV Enclosure

    // Convert Object to CSV column
    this.escapeCol = function (col) {
        if(isNaN(col)) {
            // is not boolean or numeric
            if (!col) {
                // is null or undefined
                col = '';
            } else {
                // is string or object
                col = String(col);
                if (col.length > 0) {
                    // escape inline enclosure
                    col = col.split( this.enc ).join( this.enc + this.enc );

                    // wrap with enclosure
                    col = this.enc + col + this.enc;
                }
            }
        }
        return col;
    };

    // Convert an Array of columns into an escaped CSV row
    this.arrayToRow = function (arr) {
        var arr2 = arr.slice(0);

        var i, ii = arr2.length;
        for(i = 0; i < ii; i++) {
            arr2[i] = this.escapeCol(arr2[i]);
        }
        return arr2.join(this.del);
    };

    // Convert a two-dimensional Array into an escaped multi-row CSV
    this.arrayToCSV = function (arr) {
        var arr2 = arr.slice(0);

        var i, ii = arr2.length;
        for(i = 0; i < ii; i++) {
            arr2[i] = this.arrayToRow(arr2[i]);
        }
        return arr2.join("\r\n");
    };
};