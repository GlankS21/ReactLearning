import { useState } from "react"
import authAPI from "../../api/authAPI";
import BackgroundComponent from "../../components/BackgroundComponent/BackgroundComponent"
import ludoBoard from "../../assets/image/ludo board.png"
import { Form } from "antd"
import { LockOutlined, UserOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { WrapperButtonFeild, WrapperInputFeild, WrapperPasswordFeild } from "./style"

const SignInPage = () => {
  const [errorMessage, setErrorMessage] = useState("")

  const onFinish = async (values) => {
    try {
      setErrorMessage("")

      const response = await authAPI.signin(values.username, values.password);

      if (response.success) {
        localStorage.setItem("authToken", response.data.token)
        localStorage.setItem("login", response.data.login)
        window.location.href = "/ludohome"
      } else {
        setErrorMessage(response.message || "Invalid username or password")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setErrorMessage("Cannot connect to server")
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo)
  }

  return (
    <BackgroundComponent opacity={0.8}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <img
          style={{ height: "300px", width: "auto", objectFit: "contain" }}
          src={ludoBoard || "/placeholder.svg"}
          alt="Ludo Board"
          className="responsive-image"
        />
        <div
          style={{
            textTransform: "uppercase",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "30px",
            margin: "20px 0",
          }}
          className="responsive-title"
        >
          Логин
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Form
            name="signinForm"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item name="username" rules={[{ required: true, message: "Please input your username!" }]}>
              <WrapperInputFeild
                placeholder="Логин"
                prefix={<UserOutlined style={{ fontSize: "20px", color: "#666" }} />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Пожалуйста, введите свой пароль!" },
                { min: 6, message: "Пароль должен содержать не менее 6 символов!" },
              ]}
            >
              <WrapperPasswordFeild
                placeholder="Пароль"
                prefix={<LockOutlined style={{ fontSize: "20px", color: "#666" }} />}
              />
            </Form.Item>

            {errorMessage && (
              <div style={{ position: "absolute", bottom: "42px", left: 0, right: 0, textAlign: "center", color: "#ff4d4f"}}>
                {errorMessage}
              </div>
            )}

            <Form.Item style={{ marginBottom: "0" }}>
              <WrapperButtonFeild type="primary" htmlType="submit">
                Логин <ArrowRightOutlined />
              </WrapperButtonFeild>
            </Form.Item>
          </Form>
        </div>

        <div style={{ color: "#fff", marginTop: "20px" }}>
          У вас нет аккаунта?{" "}
          <a href="/signUp" style={{ color: "#D4C0C0", fontWeight: "bold", textDecoration: "none" }}>
            Регистрация
          </a>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-image {
            height: 200px !important;
          }
          .responsive-title {
            font-size: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .responsive-image {
            height: 150px !important;
          }
          .responsive-title {
            font-size: 20px !important;
          }
        }
      `}</style>
    </BackgroundComponent>
  )
}

export default SignInPage