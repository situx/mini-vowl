vowlresult={"_comment":"Created with pyowl2vowl (version 0.1)","header":{"prefixList":{},"baseIris":[],"languages":[]},"namespace":[],"class":[],"classAttribute":[],"property":[],"propertyAttribute":[]}

function getTypeForProperty(prop,graph){
    for(tup in graph.statementsMatching($rdf.sym(prop),$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"))){
        //print(tup)
        if((tup+"")!="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"){
            return normalizeNS((tup+""))
        }
    }
    return "rdf:Property"
}

function getBaseIRI(iri){
    if(iri.includes("#")){
        return iri.substring(0,iri.lastIndexOf('#'))
    }
    return iri.substring(0,iri.lastIndexOf('/'))
}

function getIRILabel(iri){
    if(iri.includes("#")){
        return iri.substring(iri.lastIndexOf('#')+1)
    }
    return iri.substring(iri.lastIndexOf('/')+1)
}

function normalizeNS(prop){
    return prop.replace("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:").replace("http://www.w3.org/2000/01/rdf-schema#","rdfs:").replace("http://www.w3.org/2002/07/owl#","owl:")
}

async function loadAndConvertGraph(onturl){
    g=$rdf.graph()
    var timeout = 5000 // 5000 ms timeout
    var fetcher = new $rdf.Fetcher(g, timeout)
    await fetcher.load(onturl)
    props=[]
    propAttributes=[]
    classes=[]
    classAttributes=[]
    iriToProdId={}
    classiriToProdId={}
    propiriToProdId={}
    propidcounter=0
    classidcounter=0
    idcounter=0
    console.log(g)
    for(nstup in g.namespaces()){
        vowlresult["header"]["prefixList"][nstup[0]+""]=nstup[1]+""
        vowlresult["header"]["baseIris"].push(nstup[1]+"")
    }
    for(pred in g.statementsMatching(undefined,$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),undefined)){
        //print(pred)
        iriToProdId[pred[0]]=idcounter
        if((pred[1]+"")=="http://www.w3.org/2002/07/owl#Class" || (pred[1]+"")=="http://www.w3.org/2000/01/rdf-schema#Class" || (pred[1]+"")=="http://www.w3.org/2000/01/rdf-schema#Datatype"){
            classes.push({"id":idcounter,"type":(pred[1]+"")})
            classiriToProdId[(pred[0]+"")]={"id":idcounter,"attid":classAttributes.length-1}
            classAttributes.push({"id":idcounter,"iri":(pred[0]+""),"baseIRI":getBaseIRI((pred[0]+"")),"instances":0,"label":{"IRI-based":getIRILabel((pred[0]+""))},"annotations":{},"subClasses":[],"superClasses":[]})
            idcounter+=1
        }else{
            props.push({"id":idcounter,"type":getTypeForProperty((pred[0]+""),g)})
            propiriToProdId[(pred[0]+"")]={"id":idcounter,"attid":propAttributes.length-1}
            propAttributes.push({"id":idcounter,"iri":(pred[0]+""),"baseIRI":getBaseIRI(pred[0]),"instances":0,"label":{"IRI-based":getIRILabel((pred[0]+""))},"annotations":{},"range":[],"domain":[],"subProperties":[],"superProperties":[]})
            idcounter+=1
        }
    }
    for(pred in g.statementsMatching(undefined,$rdf.sym("http://www.w3.org/2000/01/rdf-schema#range"),undefined)){
        print(pred)
        if(!((pred[1]+"") in classiriToProdId)){
            classes.push({"id":idcounter,"type":"http://www.w3.org/2000/01/rdf-schema#Datatype"})
            classiriToProdId[(pred[1]+"")]={"id":idcounter,"attid":classAttributes.length-1}
            classAttributes.push({"id":idcounter,"iri":(pred[1]+""),"baseIRI":getBaseIRI((pred[1]+"")),"instances":0,"label":{"IRI-based":getIRILabel((pred[1]+""))},"annotations":{},"subClasses":[],"superClasses":[]})
            idcounter+=1
        }
    }

    for(iri in classiriToProdId){
        //print(iri)
        for(clsatt in g.statementsMatching($rdf.sym(iri),undefined,undefined)){
            //print(clsatt)
            if(clsatt[0]!=$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")){
                if(clsatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#subClassOf")){
                    if((clsatt[1]+"") in classiriToProdId){
                        classAttributes[classiriToProdId[iri]["attid"]]["superClasses"].push(classiriToProdId[(clsatt[1]+"")]["id"]+"")
                        classAttributes[classiriToProdId[(clsatt[1]+"")]["attid"]]["subClasses"].push(classiriToProdId[iri]["id"]+"")
                    }
                }else if(clsatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#label")){
                    classAttributes[classiriToProdId[iri]["attid"]]["label"].push((clsatt[1]+""))
                }else{
                    classAttributes[classiriToProdId[iri]["attid"]]["annotations"][(clsatt[0]+"")]=[]
                    if((clsatt[1]+"").startsWith("http")){
                        classAttributes[classiriToProdId[iri]["attid"]]["annotations"][(clsatt[0]+"")].push({"identifier":(clsatt[0]+""),"language":"undefined","value":(clsatt[1]+""),"type":"iri"})
                    }else{
                        classAttributes[classiriToProdId[iri]["attid"]]["annotations"][(clsatt[0]+"")].push({"identifier":(clsatt[0]+""),"language":"undefined","value":(clsatt[1]+""),"type":"label"})
                    }
                }
            }
        }
    }

    for(iri in propiriToProdId){
        //print(iri)
        for(propatt in g.statementsMatching($rdf.sym(iri),undefined,undefined)){
            //print(propatt)
            if(propatt[0]!=$rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")){
                if(propatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#subPropertyOf")){
                    if((propatt[1]+"") in propiriToProdId){
                        propAttributes[propiriToProdId[iri]["attid"]]["superProperties"].push(propiriToProdId[(propatt[1]+"")]["id"]+"")
                        propAttributes[propiriToProdId[(propatt[1]+"")]["attid"]]["subProperties"].push(propiriToProdId[iri]["id"]+"")
                    }
                }else if(propatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#range") && (propatt[1]+"") in propiriToProdId){
                    propAttributes[propiriToProdId[iri]["attid"]]["range"].push(classiriToProdId[(propatt[1]+"")]["id"]+"")
                }
                else if(propatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#domain") && (propatt[1]+"") in propiriToProdId){
                    propAttributes[propiriToProdId[iri]["attid"]]["domain"].push(classiriToProdId[(propatt[1]+"")]["id"]+"")
                }
                else if(propatt[0]==$rdf.sym("http://www.w3.org/2000/01/rdf-schema#label")){
                    propAttributes[propiriToProdId[iri]["attid"]]["label"].push((propatt[1]+""))
                }
                else{
                    propAttributes[propiriToProdId[iri]["attid"]]["annotations"][(propatt[0]+"")]=[]
                    if((clsatt[1]+"").startsWith("http")){
                        propAttributes[propiriToProdId[iri]["attid"]]["annotations"][(propatt[0]+"")].push({"identifier":(propatt[0]+""),"language":"undefined","value":(propatt[1]+""),"type":"iri"})
                    }else{
                        propAttributes[propiriToProdId[iri]["attid"]]["annotations"][(propatt[0]+"")].push({"identifier":(propatt[0]+""),"language":"undefined","value":(propatt[1]+""),"type":"label"})
                    }
                }
            }
        }
    }

    vowlresult["property"]=props
    vowlresult["propertyAttribute"]=propAttributes
    vowlresult["class"]=classes
    vowlresult["classAttribute"]=classAttributes
    return vowlresult
}
