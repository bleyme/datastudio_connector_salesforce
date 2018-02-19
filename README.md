# Build Data Studio Connector for Salesforce

Google Data Studio (beta) is a business intelligent tool designed by Google to help you turning your data into informative dashboards and reports that are easy to read, easy to share, and fully customizable.

Data Studio provides built-in connector but is also allowing you the ability to build your own connector.Goal of this repository is to show how to build a Data Studio connector for Salesforce in order to made Salesforce data available in your reports and dashboards.

# Table of contents
  * [Requirements](#requirements)
  * [Get credentials from Salesforce](#get-credentials-from-salesforce)
     * [Overview on Salesforce REST API](#overview-on-salesforce-rest-api)
     * [Create a connected app](#create-a-connected-app)
  * [Build a DataStudio connector](#build-a-datastudio-connector)
     * [Define DataStudio fields](#define-datastudio-fields)
     * [REST call with Salesforce](#rest-call-with-salesforce)
     * [Build your report in Data Studio](#build-your-report-in-data-studio)

# Requirements

 - [Google Data Studio](https://datastudio.google.com)
 - [Google Apps Script](https://script.google.com)
 - [Salesforce account with admin rights](#https://salesforce.com)

# Get credentials from Salesforce
## Overview on Salesforce REST API
REST API documentation from Salesforce can be found here: [Introducing Force.com REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm)

As for many REST web services, you need a **CLIENT_ID** and **CLIENT_SECRET** to interact with Salesforce. Then you can request for an access token with a POST request to https://login.salesforce.com/services/oauth2/token. 
With this access token, you can use it as a Bearer token in your HTTP headers.

Therefore you can get data from Salesforce HTTP with theon eader forms:
|Header form  | Value |
|--|--|
| Content-Type | application/json |
| Authorization	 | Your access token |

From here you can requests one of the many endpoints provided by Salesforce. 
## Create a connected app
In order to get Consumer Key and Consumer Secret (client_id/client_secret) you need to create a Connected App in the following location in Salesforce: *Setup > Manage Apps > Connected Apps* 

To get Consumer Key and Consumer Secret: *Setup > Build > Create > Apps* :
![enter image description here](https://lh3.googleusercontent.com/9VNdLveHvDPhQQ1DTQo7XkRTe6e6WWkWb27faoPvX9W44xQCoYOWu4S69FwyNaysj5jNIlObWxgZBHjt9m4=w1374-h211-rw)

As we saw above, you need a **CLIENT_ID** and **CLIENT_SECRET** to get access via API. You also need a combination of your password and an additional security token.

A security token can be generated in your profil settings here: `https://YOUR_INSTANCE.my.salesforce.com/_ui/system/security/ResetApiTokenEdit?retURL=%2Fui%2Fsetup%2FSetup%3Fsetupid%3DPersonalInfo&setupid=ResetApiToken`
Replace **YOUR_INSTANCE** with your own custom domain in Salesforce.

Reminder of requirements to request Salesforce REST API:

Requirement | Description 
------------ | -------------
CLIENT_ID	| Provided by the connected app: Consumer Key
CLIENT_SECRET | Provided by the connected app: Consumer Secret
USERNAME | Salesforce username (most of the time it's your email address) 
PASSWORD | Combination of your Salesforce password AND security token. Looks like this: YourpasswordSecuritytoken 

# Build a DataStudio connector
This repository is showing how to build a simple Data Studio connector for Salesforce using Google Apps Script. First go to https://script.google.com and create a new project.
In the main code, you can paste the content of main.js

## Salesforce tokens in main.js
 
Replace *XXXXXXXXXXXXXXXXXXXXXX* with credentials defined in [Create a connected app](#create-a-connected-app) section.
```javascript
  var url_token = 'https://login.salesforce.com/services/oauth2/token';
  var payload = {
    'grant_type':'password', 
    'client_id':'XXXXXXXXXXXXXXXXXXXXXX', 
    'client_secret':'XXXXXXXXXXXXXXXXXXXXXX',
    'username':'XXXXXXXXXXXXXXXXXXXXXX', 
    'password':'XXXXXXXXXXXXXXXXXXXXXX' 
  };
```


## Define DataStudio fields
In order to make it simple, we will extract from Salesforce the following fields:
 - Name
 - Site
 - Type

Name and Type are string values. Site is a Geo value, therefore content should be something like a city, continent, region or country. In our case, Site is corresponding to a city such as Paris or London. 

We define the fields the following way:
```javascript
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
```
We also define a simple metric 'count' to help us create reports later in Data Studio:
```javascript
  {
    name: 'count',
    label: 'Count',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: true
    }
  }
```
Check official references from Google for other data types: https://developers.google.com/datastudio/connector/reference


## REST call with Salesforce
In our case, as we said we want to extract only Name, Site and Type.
To do that, we need to create a SOQL request:
```sql
    SELECT Name, Site, Type FROM Account
```
For next steps, first we request for an access token. This part of the code managing that:
```javascript
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
    
```
Then, using this token we request Salesforce with the SOQL request defined above. This part is managed by the following code:
```javascript

var url = ["https://YOUR_INSTANCE.salesforce.com/services/data/v40.0/query/?q=SELECT+Name,+Site,+Type+from+Account"];
var headers = {
     method: "get", 
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + accessToken.access_token
  },
}

var response = JSON.parse(UrlFetchApp.fetch(url.join(''), headers)).records;
```

Replace **YOUR_INSTANCE** with your own Salesforce custom domain.

Code is ready on Apps Script, we need to define a manifest file:
![enter image description here](https://lh3.googleusercontent.com/UiyiX00Boxna9_VNFymgarSGmUvcNP62SZ2ZPs7Y_LuVTrZ88aaEr1N-FbLxg4G686FlqRlNIMezcuItgHrDseZ3jycrtfi979i1YMo6DUEFycT7qfudwmBMMkc3evZ1WXvsgW_ci-iamt-OfC5TF91G7YBPz-etSdOugcV2tOznDEjpDnNB9U3LmxuSTNV-oXkhps3aCJbe2N7BXoHIOtriZv3tWt9wtcFoxRbWax0kv_pJh3_nMJMoAF4UsiIo1jpqYGVstx_SpXjc8GcBrFjpv1ZPxCS5T3tS6YNK1fwOb4Tu-X3rHN0ryK6UI4VsJW5tSWEqpXiQWK2JfR8wZVARM4SB5RNpi_Yimi345oxN7CxbcNGFwagDFq5Jyeqw6Klbs1hMjCjFoHsyBA_jonrwOKbT6PJ6sg3NN7oXCjC86Dubou238T8vSIuH2NvlmUY5NY5MFLymA6ewxQH0qwLcSr2tDOoMw9jBQYdTNd0nPbv271EZoaveqjXXrrSojG9DLSZq7ClIepzQYHaSj5LA9j4hMaDvb7eH6VKh9YNm5J0ZF11UdmC7ib-2GenuXWE6iNtFQDbsdYLlp7etIt_0hXYDQ2A3jrmfT8qc=w965-h346-no)

Once the connector code and manifest are configured, you can deploy your connector this way:
![enter image description here](https://lh3.googleusercontent.com/v4c0e7YrjPb5jUMdE4nTDBAj4knaXK_ztkSvXR4qIUekHII62AxHVBH2kkFoS-JRXa0DcU8wFLd6J5AjZgQFuVhVULhyOca5351AFF6-ozL-tanuImJYGqH0HvlqqS_llfEYUlFf0g-YYj0BLWRa-TIaG00TEjvrUKI6erUlFul8JOOtam82l6DYfNfGnEu14C7rSan6e_brSA0XrFRC3Lq5oovYqt00Mb-t77X5pQcWfIJg6JcMNF-qFE3rqXcH6Saakkdr4z4nLbKqLQo4s8khVIqFd-sfCvegNiaJnuBLwxcSo_i-X6tuAyiW5GwyPxzvrd1POOylayedjXtkzGMzIF8fz3-7jpMvl_TkmFws28picrsNY8iZs7-QwCsYP9LzQZDguIm5F-pA8o4fN-uJd7bRWutOVv14sPWyocUOqUkGwplpo8BSm7ReJ_1O8ywsOl13X8wTJQInbFqBovCWrMui7WZM4bLBZpJq4mGonjhAKo5Auu1m4XUL93hFWYUQ9coJjJPkMxOVM_qh2cHdURJq_MQP172mtH9JJfE84Jfe0a7fT2V_9INq_y6R8NqsXt8EqiJs6duVslefDaFCV0xZpaD0y17o98Qr=w457-h207-no)

Get URL of your deployed connector.

## Build your report in Data Studio
Now we have a specific link for your version of the Data Studio Connector. Clicking on it is redirecting you in Data Studio and asking you to authorize your Google account to connect to another external service:
![enter image description here](https://lh3.googleusercontent.com/SatSNoXRIJ4wQh7yfHC4mShgfHq0stN0S9cpL-DpP0ZtRp8qsWDhR0MKbb_T3KSubrhdRCdz7LHetYfnjLHDXA7v8VaaZbCnuympHjQo52mvtB4QOpP60EgB3MDdtPKvN8dz-ZbDiwbIWh8Jn6Ze7gUEKbJLza-yiSYxFlmpN9ydJN-ol2TJLtF-NDD5HQQWNIm_Me4ZTySzQyouSGqRrEFXPCC8O_asV_f4STwwQJvUZcF0LWJMoV94b8aA1bcvyoKyLoMrTnrBuQQ8iUkJohCZho_e-HwLXLk_bDQ962wGNF3YbyoXzgkz0sl5fHuHjD-ygGpa_HeRHBfN73L024WVhpsBSKSqbcg8c-U-OlvRFvD-eSXE0RgN-1RAS0QLIOeeSRv7yRLzWOHZCP1mI2lufO5PgV_cpTDxF5rQsGK_B57qsIUTN7zpx5Uw3uirSA1V7bHZ0S3GaxWnxl-oR9HJoZZd0ChL9wuxYeBx4vtpjQdtVauM8F-p4p--Kn6SmraywHuHkxgAOUZFGu7WR1Yhqp11tVD1mHP4Oq5Gh7yrzmqDnNKjxF9_Gsc6VnGTUpS_ZYxzUHbgx9m9VypL9ayf6oPYTKffbKRvWoCT=w931-h374-no)

Then click on connect in top right. You will see that fields defined in Apps Script are well imported:
![enter image description here](https://lh3.googleusercontent.com/KZo24AIsWY6baz6j6zCpLdmkvnKR3YA4Qs7sQ4DR9d5JGIu3fsKLmA09xOK0dx-myxA7fMOJTNPf3P8ERMHsQdHiqG5pS3IwLyyNJVgvyQyEN-DXZ69WTkJTp6dSHV1tPqldS0hrEWm_3rc926891Ilr-PhCH4Vp0BCgJT7I1cnLATuw7yWWUAfgod7p6DwBdHlS3VfwCgkYo5FZkeh76-8aLNw2qxBU1_FrWNcfw4Ga5-jWE_PH3R9ysPXZpSpsodDrz48DsiiaLdEVfswS75sFDzkvs52uJbwmsgHsh_ba4cDrrGcXOil1NXrsC4S1FYq0rr25xZB2r8_xIWFos49eFbGrYhiddVmbec-eIRGhrMY8Kyk5YJAnq0v9_xbwLLBPw0609qctT0J5-mBlmCWhyAvE80mJ7ezCmIPP4aY5mB9NcsAhPeIsGovpS77cTsDPPlpX7BqXa8Sjik1d-V9h61zXc0wC_f3MeBBDEPZrMY0-0xrAkkb8iqW2FbgMprRPDpUDOF3zKh4VG0ks8XGin63f5lvlx78pHOgHnc2uPqiztqe8IH9lOwyd49zB1ZuGDdSEP3876JFTzYVyFEkoAMzNu-miz7IjjwZr=w829-h231-no)

Click on Create Report.
From here you can create a simple report and create a **Geo Map** showing presence of your clients in France:
![enter image description here](https://lh3.googleusercontent.com/8Am8uQQzdRU34ocPrBq9tHYVg-maf_wDNcQb7fwic_OiTOyGoJRKXOE32hLYjNoUR9nc2AvSqRA9uw2qCkXUXOmNXv_FP0HVgy3zxvWrkhXmfvOVfI1w7hGdP50xp4A0HfbK6RJLpGTz5hYKd5WkVFwdPEPqbtQJx_NpONybWvXWm4sI2DwHlNRr24mLU6DNqqBKuzMjaGUAAPiEWFtewUZvdDEcRT2e3uxmKSQrZPdxvVObc0xVjY0Xweh-KLEeB7I6VxvoQEG_Y3IoaP5Un-cnh47QUv9CV42isW4MyjEQqyv-Md7vLV44qAAHICYJMD3KdhGKcxYWl_XmmeP7j7A5VRShKImEs4OaMkCKx0Vzq6R2nSKBwCHH6Skz1Z7yThe6vFDliqd_pR3LoGXPQUUmV6h1epRuq-LVpUeQKMedQ6RjUfbcjXU_NFIKYSO8HBrNm_yv30tT0H74JLyumrbB37CIZPOWrIRIJakLtz3AX93XRsRZXnN2BRAM-YEteHcwaulNPNHaamzRPCPaU6UbUfsjSPfXEqALGrjFwJHzU_0pxpKsVe6VOaWGE_W39PkDG6neNXXpYf57DcvKg1f8gpfLjUhBnUC8e456=w924-h678-no)

Of course, this report is automatically refreshed once executed. It will retrieve data with REST Salesforce API and made it available on DataStudio.
