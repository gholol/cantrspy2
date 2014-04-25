@echo off
call ..\AIR\SDK\bin\adt -package -storetype pkcs12 -keystore ..\..\Security.OLD\AIR-JosephCrowe.pfx published\package.air  application.xml content modules locale icons changes.log || pause