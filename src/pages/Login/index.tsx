import LoginForm from "@/components/LoginForm";

function Login() {
  return (
    <div className="min-h-screen bg-red-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default Login;