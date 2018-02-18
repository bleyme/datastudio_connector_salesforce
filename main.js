function getConfig(request) {
  var config = {
    configParams: [
      {
        type: "INFO",
        name: "connect",
        text: "This connector does not require any configuration. Click CONNECT at the top right to get started."
      }
    ]
  };
  return config;
};

var DataSchema = [
  {
    name: 'Name',
    label: 'Name',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  
  {
    name: 'Site',
    label: 'Site',
    group: 'Geo',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'CITY',
    }
  },

  {
    name: 'Type',
    label: 'Type',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },

  {
    name: 'count',
    label: 'Count',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: true
    }
  }
];

function getSchema(request) {
  return {schema: DataSchema};
};

function getData(request) {
  var dataSchema = [];
  request.fields.forEach(function(field) {
    for (var i = 0; i < DataSchema.length; i++) {
      if (DataSchema[i].name === field.name) {
        dataSchema.push(DataSchema[i]);
        break;
      }
    }
  });

  var url_token = 'https://login.salesforce.com/services/oauth2/token';
  var payload = {
    'grant_type':'password', 
    'client_id':'XXXXXXXXXXXXXXXXXXXXXX', 
    'client_secret':'XXXXXXXXXXXXXXXXXXXXXX',
    'username':'XXXXXXXXXXXXXXXXXXXXXX', 
    'password':'XXXXXXXXXXXXXXXXXXXXXX' 
  };

  var options = {
    'method':'post',
    'payload':payload
  };

  var results = UrlFetchApp.fetch(url_token, options);
  
  var accessToken = JSON.parse(results);

  var url = ["https://YOUR_INSTANCE.my.salesforce.com/services/data/v40.0/query/?q=SELECT+Name,+Site,+Type+from+Account"];
  
  var headers = {
     method: "get", 
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + accessToken.access_token
    },
  }
  
  var response = JSON.parse(UrlFetchApp.fetch(url.join(''), headers)).records;

  var data = [];
  response.forEach(function(font) {
    var values = [];
    dataSchema.forEach(function(field) {
      switch(field.name) {
        case 'Name':
          values.push(font.Name);
          break;
        case 'Site':
          values.push(font.Site);
          break;
        case 'Type':
          values.push(font.Type);
          break;          
        case 'count':
          values.push(1);
          break; 
        default:
          values.push('');
      }
    });
    data.push({
      values: values
    });
  });

  return {
    schema: dataSchema,
    rows: data
  };
};

function getAuthType() {
  var response = {
    "type": "NONE"
  };
  return response;
}