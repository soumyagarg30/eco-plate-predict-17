
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginTabs from "@/components/login/LoginTabs";
import { useLoginAuth } from "@/components/login/useLoginAuth";

const LoginForm = () => {
  const {
    userType,
    setUserType,
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    handleLogin
  } = useLoginAuth();
  
  return (
    <div className="container mx-auto px-6 py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-foodie-green-dark">
            Login to FoodieSync
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        {loginError && (
          <Alert variant="destructive" className="mb-4 mx-6">
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
        <LoginTabs
          userType={userType}
          setUserType={setUserType}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isLoading={isLoading}
          loginError={loginError}
          handleLogin={handleLogin}
        />
      </Card>
    </div>
  );
};

export default LoginForm;
