/**
 * 
 * String Template Engine Class
 * 
 */

//  Dependencies
const fs = require('fs');
const path = require('path');

 class Stringer {

    getStrFromFile(fileName, ext = null) {
        // Get the file string
        let defaultExt = ext ? ext : "html"
        fileName = fileName.replace('.', "/");
        let fileStr = fileName ? fs.readFileSync(path.join(__dirname, `../../resources/${fileName}.${defaultExt}`)) : '';
        return fileStr.toString()
    }

    getExentendFile(str) {
        let extendFileName = str.match(/\@extend\('?"?([a-zA-Z\/\.]*)'?"?\)/i) ? str.match(/\@extend\('?"?([a-zA-Z\/\.]*)'?"?\)/i)[1] : '';
        extendFileName = extendFileName.replace('.', '/')
        return extendFileName
    }

    handleIncludes(fileName) {
        let fileStr = this.getStrFromFile(fileName);

        // Get the extend File
        let extendFileStr = this.getStrFromFile(this.getExentendFile(fileStr));
        
        // Extend to the main
        let lastFile = this.extend(extendFileStr, fileStr);
       

        // check for include and include them
        let allIncludes = lastFile.match(/@render\('?"?([a-z0-9_.]*?)'?"?\)/gmi) ? lastFile.match(/@render\('?"?([a-z0-9_.]*?)'?"?\)/gmi): [];
        
        if(allIncludes.length > 0){
            //get full fileName 
            let includeFileName = allIncludes.map(file => {
                let strToReturn = file.replace(/@render\('?"?/mgi, '');
                strToReturn = strToReturn.replace(/'?"?\)/mgi, '');
                return strToReturn
            });
    
            // Get the contents of that page and fill it
            let includeContents = {};
            includeFileName.forEach(file => {
                includeContents[file] = this.getStrFromFile(file);
            });
    
    
            for(let key in includeContents) {
                
                lastFile = lastFile.replace(`@render('?"?${key}'?"?)`, includeContents[key]);
                
            };
            lastFile = lastFile.replace(/\n/gmi, ' ');
            return lastFile;
        } else {
            fileStr = fileStr.replace(/\n/gmi, ' ');
            return lastFile
        }

    }


    getVariables(main, str) {
        let vars = str.match(/@var\((\w+):"?'?.*?"?'?\)/gmi) ? str.match(/@var\((\w+):"?'?.*?"?'?\)/gmi) : [];
        // console.log(vars);
        let mainVars = vars.map(vr =>{
            vr = vr.replace(/@var\((\w+):'?"?(.*)'{0,1}"{0,1}\)/,"$1[|=|========!|s|e|p|a|r|a|t|o|r|!========|=|]$2")
              return vr
          })

        let varObj = {};
        mainVars.forEach(inVar => {
            inVar = inVar.trim();
            let splitVar = inVar.split('[|=|========!|s|e|p|a|r|a|t|o|r|!========|=|]');
            let key = splitVar[0].trim();
            let value = splitVar[1].trim();
             varObj[key] = value
        });

        let echoedVars = main.match(/{{(var:(\w+))}}/gmi)? main.match(/{{(var:(\w+))}}/gmi) : [] ;
        let allVars = {};
        echoedVars.forEach(vr => {
            let vrr = vr.replace(/{{var:(\w+)}}/, "$1");
            allVars[vrr] = vr;
          });


          for(let key in allVars){
            //   console.log(varObj[key]);
            let strtoWork =  varObj[key] ?  varObj[key] : '';
              let mainStr = strtoWork.trim().replace(/('?"?)$/, "");
              mainStr = mainStr ? mainStr : []
              main = main.replace(allVars[key], mainStr)
          }

          return main;

    }

    extend(main, str) {
        // Get the contents of the Extended File;
        main = this.getVariables(main, str);
        let extendFile = main;
        str = str.replace(/\n/gmi, ' ')
        // Get section of the Pages and Add them to the Extending file
        let extendSections = extendFile.match(/{{create-section:\b(\w+)*\b}}/gmi) ;
        extendSections = extendSections ? extendSections : [];
        // get their respective section Names
        let sectName = extendSections.map(sect => {
            sect = sect.replace(/{{create-section:(\b(\w+)\b)}}/gmi, "$1")
            return sect
        })
        

        sectName.forEach(names => {
            let regString = `(?<=@part\\('?"?${names}?'?"?\\))(.*?)(?=@end\\('?"?${names}?'?"?\\))`;
            let regex = new RegExp(regString, "gmi");
            let strToInsert = str.match(regex) ? str.match(regex)[0] : '';
            regString = `{{create-section:\\b(${names})\\b}}`;
            regex = new RegExp(regString, 'gmi');
            extendFile = extendFile.replace(regex, strToInsert)
        });

        // Set all variables

        return extendFile;

    }

    includeFile(str) {

        // check for include and include them
        let allIncludes = str.match(/@render\('([a-z0-9_.]*)'\)/gmi);
        allIncludes = (!allIncludes) ? [] : allIncludes
        if(allIncludes.length > 0){
             //get full fileName 
             let includeFileName = allIncludes.map(file => {
                let strToReturn = file.replace(/@render\('/mgi, '');
                strToReturn = strToReturn.replace(/'\)/mgi, '');
                return strToReturn
            });
    
            // Get the contents of that page and fill it
            let includeContents = {};

            includeFileName.forEach(file => {
                includeContents[file] = this.getStrFromFile(file);
                
            });
    
            for(let key in includeContents) {
                str = str.replace(`@render('${key}')`, includeContents[key]);
            };

            return this.includeFile(str)
        } else {
            return str;
        }
    }
    parseString(fileName) {
        return this.includeFile(this.handleIncludes(fileName));
    }

    getAsset(assetName) {
        let assetArr = assetName.split('.');

        assetName = `assets/${assetArr[0]}`
        return this.getStrFromFile(assetName, assetArr[1]);
    }

 }


// Start with parseString(fileName) file must be located in ur project root folder /resources
// Open issue if u want to use this
//  Export Module
module.exports = Stringer
