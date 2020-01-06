---
layout: post
title: RunDeck Series 5 - Encrypt Key Files And Passwords In RunDeck
date: 2018-12-29 10:46:53.000000000 +00:00
description: We can encrypt key files passwords in rundeck. Its using Hashicorp Vault in the backend. We can encrypt Private, Public and Passwords.

categories:
- Rundeck
tags:
- automation
- mysql
- rundeck
- rundeck series
- security

---
![Encrypt Key Files And Passwords]({{site.baseurl}}/assets/Encrypt-Key-Files-And-Passwords_cover-1024x398.jpg)

While managing multi servers in a single place, we need a secure authentication method which includes SSH Keys, Passwords and etc. RunDeck is having a great feature called Key Storage. RunDeck Key Storage is a secure and encrypted place for storing confidential contents. Its using **[HashiCorp Vault](https://www.vaultproject.io/)** for this. Its already enabled by default. So we just upload our keys and creating encrypted passwords.

Encrypting PEM Files:
---------------------

-   Click the Gear Icon and Go to Key Storage.
-   Then you can select that you want to store Key files or Password.

-   Key Type: Public Key
-   Then you can upload your Public Key file or just copy the file contents and paste it.
-   Storage path: Keys/ is the default storage location for all encrypted files. But we can make folders inside the keys/. (Eg: Keys/prod-servers/ Keys/mysql-password/)
-   Name: An unique name for your encrypted file.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords.jpg)

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords1.jpg)

Encrpting Passwords:
--------------------

-   Click the Gear Icon and Go to Key Storage.
-   **Key Type:** Password
-   **Enter text:** Give your password.
-   **Storage path:** You can leave it in Keys or create folders inside it.
-   **Name:** An unique name for your encrypted file.

![]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords3.jpg)

Use Encrypted Passwords/Files:
------------------------------

I have encrypted mysql passwords and Im going to create a job which uses this encrypted password.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords4.jpg)

Create Jobs:
------------

I already encrypted the password and named as `mysql-sqladmin`.

1.  **Go to Job** --> Create New Job.
2.  **Job Name:** mysql-status
3.  **Description:** Example Job

We are going to use an encrypted password in the Options section.
Options --> Add Option.

![]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords5.jpg)

-   **Option Type:** Text
-   **Option Name:** mysql-admin-password
-   **Option Label:** mysql admin password
-   **Description**: Something you want.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords3.jpg)

-   In the Input Type select **secure**.
-   In the Storage Path(you can see this above Input type option), Click select button and select an encrypted password.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords6-1024x173.jpg)

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords7-1024x107.jpg)
In the bottom, you can see the parameter to call the encrypted password.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords8-1024x247.jpg)

-   In the WorkFlow --> Add Step.
-   Under the Node Step click Script.
-   Add the below script.

![]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords9.jpg)

{% highlight shell %}
mysql -h 10.0.0.1 -u sqladmin -p$RD_OPTION_MYSQL_ADMIN_PASSWORD mysql -e"status;"
{% endhighlight %}

Give the step name and save it and click Create.

## Run the Job:
------------

Click on Run Job Now. You can get the output on the same screen.

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords10.jpg)

![Encrypt Key Files And Passwords]({{ site.baseurl }}/assets/Encrypt-Key-Files-And-Passwords11-1024x489.jpg)