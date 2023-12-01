function validateForm()
     {
        document.getElementById('email-error').textContent = '';
        document.getElementById('password-error').textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email) 
        {
            document.getElementById('email-error').textContent = 'Email field should not be empty';
            return false;
        }

        if (!password || password.length < 6) 
        {
            document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
            return false;
        }

        return true;
    }

