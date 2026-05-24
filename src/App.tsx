import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import DynamicBackground from "./components/DynamicBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import WriteArticlePage from "./pages/WriteArticlePage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import FilesPage from "./pages/FilesPage";
import ArticlesPage from "./pages/ArticlesPage";



export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen">
            <DynamicBackground />

            <Navbar />

            <div className="main-continer">
              <Routes>
                {/* Login page - full width, no sidebar */}
                <Route path="/login" element={<LoginPage />} />

                {/* All other routes with sidebar layout */}
                <Route
                  path="*"
                  element={
                    <>
                      <div className="layout-wrapper">
                        <div className="layout-sidebar">
                          <Sidebar />
                        </div>
                        <div className="layout-content">
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/articles" element={<ArticlesPage />} />
                            <Route path="/chat" element={<ChatPage />} />
                            <Route path="/files" element={<FilesPage />} />
                            <Route
                              path="/article/:id"
                              element={<ArticleDetailPage />}
                            />
                            <Route
                              path="/write"
                              element={
                                <ProtectedRoute requireAdmin>
                                  <WriteArticlePage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/write/:id"
                              element={
                                <ProtectedRoute requireAdmin>
                                  <WriteArticlePage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/admin"
                              element={
                                <ProtectedRoute requireAdmin>
                                  <AdminPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/profile"
                              element={
                                <ProtectedRoute requireAuth>
                                  <ProfilePage />
                                </ProtectedRoute>
                              }
                            />
                          </Routes>
                        </div>
                      </div>
                      <Footer />
                    </>
                  }
                />
              </Routes>
            </div>

            <BackToTop />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
