/** Called automatically by JsDoc Toolkit. */
function publish(symbolSet) {
    publish.conf = {  // trailing slash expected for dirs
        ext:         ".json",
        outDir:      JSDOC.opt.d || SYS.pwd+"../out/",
    };

    symbolSet.deleteSymbol("_global_");
    symbolSet.deleteSymbol("Error");

    // create the folders and subfolders to hold the output
    IO.mkPath((publish.conf.outDir).split("/"));

    // some ustility filters
    function hasNoParent($) {return ($.memberOf == "")}
    function isaFile($) {return ($.is("FILE"))}
    function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace)}

    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();

    // get a list of all the classes in the symbolset
    var classes = symbols.filter(isaClass).sort(makeSortby("alias"));

    var outputJson = {
        classes: [],
    }
    // create each of the class pages

    for (var i = 0, l = classes.length; i < l; i++) {
        outputJson.classes.push(processData(classes[i]));
    }

    IO.saveFile(publish.conf.outDir, 'jsdoc.json', JSON.stringify(outputJson, null, '    '));
}

/** Make a symbol sorter by some attribute. */
function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    }
}

function escapeQuate(str)
{
    return '"' + str.replace('"', '\\"') + '"';
}

function processData (data)
{
    var result = {
        name: data.name,
        alias: data.alias,
        builtin: Boolean(data.isBuiltin())
    };
    
    if (data.isNamespace)
    {
        result.namespace = true;
        result['function'] = Boolean(data.is('FUNCTION'));
        result['class'] = false;
    }
    else
    {
        result.namespace = false;
        result['function'] = false;
        result['class'] = true;
    }
    if (data.version)
    {
        result.version = data.version;
    }
    result['extends'] = data.augments.map(function (item) {
        return item.desc;
    });
    result.description = data.classDesc;
    if (!data.isBuiltin() && (data.isNamespace || data.is('CONSTRUCTOR')))
    {
        result['constructorMethod'] = processMethod(data, true);
    }
    result.properties = data.properties.map(function (item) {
        return processProperty(item);
    });
    result.methods = data.getMethods().map(function (item) {
        return processMethod(item);
    });
    result.events = data.getEvents().map(function (item) {
        return processMethod(item);
    });
    return result;
}

function processMethod(data, isConstructor)
{
    var result = {};
    if (!isConstructor)
    {
        result['name'] = data.name;
        result['static'] = Boolean(data.isStatic);
        result['type'] = data.type;
        result.requires = data.requires.slice(0);
    }
    result.returns = data.returns.map(function (item) {
        return processSubType(item);
    });
    result.params = data.params.map(function (item) {
        return processSubType(item, "param");
    });
    result.exceptions = data.exceptions.map(function (item) {
        return processSubType(item, "exception");
    });
    processCommonData(result, data);
    return result;
}

function processProperty(data)
{
    var result = {};
    result['static'] = Boolean(data.isStatic);
    result['type'] = Boolean(data.type);
    result['name'] = Boolean(data.name);
    result['constant'] = Boolean(data.isConstant);
    if (data.defaultValue)
    {
        result.defaultValue = data.defaultValue;
    }
    processCommonData(result, data);
    return result;
}

function processCommonData(result, data)
{
    result.inner = Boolean(data.isInner);
    result['private'] = Boolean(data.isPrivate);
    result.description = data.desc;
    result.sourceFile = data.srcFile;
    result.examples = data.examples;
    if (data.author)
    {
        result.author = data.author;
    }
    if (data.deprecated)
    {
        result.deprecated = data.deprecated;
    }
    if (data.since)
    {
        result.since = data.since;
    }
    data.see = data.see.slice(0);
    return result;
}

function processSubType(data, type)
{
    var result = {
        type: data.type,
        description: data.desc
    };
    if (type === 'param')
    {
        result.name = data.name;
        result.optional = Boolean(data.isOptional);
        if (data.defaultValue)
        {
            result.defaultValue = data.defaultValue;
        }
    }
    else if (type === 'exception')
    {
        result.name = data.name;
    }
    return result;
}
