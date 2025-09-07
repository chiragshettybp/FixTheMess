import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ArrowRight, CheckCircle, Star, Shield, Zap, Users, Clock, Globe, Target, TrendingUp, Award, Play, Menu, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';
const Join = () => {
  const navigate = useNavigate();
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Flowing background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Animated flowing elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full flowing-gradient opacity-20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full flowing-gradient opacity-30 blur-2xl animate-pulse" style={{
        animationDelay: '2s'
      }} />
        <div className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full flowing-gradient opacity-25 blur-xl animate-pulse" style={{
        animationDelay: '4s'
      }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border/30 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <img src={logo} alt="FixTheMess Logo" className="h-6 w-6 object-contain" />
              </div>
              <span className="font-bold text-xl text-gradient text-slate-50">FixTheMess</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-sm font-medium">
                Home
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('about')} className="text-sm font-medium">
                How It Works
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('features')} className="text-sm font-medium">
                Features
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('about')} className="text-sm font-medium">
                Social Impact
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('testimonials')} className="text-sm font-medium">
                Testimonials
              </Button>
              <Button variant="ghost" onClick={() => scrollToSection('contact')} className="text-sm font-medium">
                Contact
              </Button>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button variant="ghost" onClick={() => navigate('/')} className="justify-start">
                      Home
                    </Button>
                    <Button variant="ghost" onClick={() => scrollToSection('about')} className="justify-start">
                      How It Works
                    </Button>
                    <Button variant="ghost" onClick={() => scrollToSection('features')} className="justify-start">
                      Features
                    </Button>
                    <Button variant="ghost" onClick={() => scrollToSection('about')} className="justify-start">
                      Social Impact
                    </Button>
                    <Button variant="ghost" onClick={() => scrollToSection('testimonials')} className="justify-start">
                      Testimonials
                    </Button>
                    <Button variant="ghost" onClick={() => scrollToSection('contact')} className="justify-start">
                      Contact
                    </Button>
                    <div className="border-t pt-4 space-y-3">
                      <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                        Login
                      </Button>
                      <Button onClick={() => navigate('/auth')} className="w-full">
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center space-x-3">
                <Button variant="outline" onClick={() => navigate('/auth')} className="text-sm">
                  Login
                </Button>
                <Button variant="ghost" onClick={() => navigate('/auth')} className="text-sm">
                  Sign Up
                </Button>
              </div>

              {/* Report Mess Button - Always Visible */}
              <Button onClick={() => navigate('/auth')} size="sm" className="bg-warning hover:bg-warning/90 font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 bg-blue-600 hover:bg-blue-500 text-slate-50">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Report Mess</span>
                <span className="sm:hidden">Report Mess</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-32">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }}>
              <Badge variant="outline" className="text-primary border-primary/50 px-4 py-2">Trusted by 10,000+ Citizens Worldwide</Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="saas-headline">
              See it. Report it. <span className="text-gradient italic font-light">Solve it.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.4
          }} className="saas-subheading mx-auto">
              Streamline your civic engagement, boost community participation, and achieve transparent governance with our cutting-edge platform that transforms citizen reports into rapid government action.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.6
          }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium">Report Mess</Button>
              
            </motion.div>

            {/* Feature Highlights */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.8
          }} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>4-6 week delivery</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Transparent governance</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>100% satisfaction guarantee</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Logos Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }} className="text-center space-y-8">
            <p className="text-sm text-muted-foreground">
              Trusted by governments around the world
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              {/* Government logos placeholder */}
              {Array.from({
              length: 6
            }).map((_, i) => <div key={i} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {['Federal Bureau', 'City Hall', 'State Dept', 'Public Works', 'Emergency Svc', 'Municipal'][i]}
                  </span>
                </div>)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How Our App Works - Timeline Section */}
      <section id="about" className="relative z-10 py-24 saas-section">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-16">
            <motion.h2 initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} viewport={{
            once: true
          }} className="text-3xl lg:text-5xl font-bold">
              How Our <span className="text-gradient italic">App Works</span>
            </motion.h2>
            <motion.p initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} viewport={{
            once: true
          }} className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From spotting an issue to seeing it resolved - our streamlined process makes civic engagement simple and effective.
            </motion.p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-primary/20 hidden md:block"></div>
            
            <div className="space-y-12">
              {[{
                step: "01",
                icon: AlertTriangle,
                title: "Spot the Issue",
                description: "See a problem in your community? Take a photo, add details, and mark the location with our intuitive reporting interface."
              }, {
                step: "02", 
                icon: Target,
                title: "Smart Routing",
                description: "Our AI automatically identifies the responsible authority and routes your report to the right department for fastest resolution."
              }, {
                step: "03",
                icon: Clock,
                title: "Real-Time Updates",
                description: "Track progress with live notifications as your report moves through acknowledgment, investigation, and resolution phases."
              }, {
                step: "04",
                icon: CheckCircle,
                title: "Problem Solved",
                description: "Get notified when the issue is resolved and rate the response quality to help improve community services."
              }].map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{
                    opacity: 0,
                    y: 30
                  }} 
                  whileInView={{
                    opacity: 1,
                    y: 0
                  }} 
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2
                  }} 
                  viewport={{
                    once: true
                  }}
                  className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col md:gap-8 gap-4`}
                >
                  {/* Content Card */}
                  <div className="flex-1">
                    <Card className="saas-card hover:scale-105 transition-transform duration-300">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-2xl font-bold text-primary">{item.step}</div>
                        </div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline Node */}
                  <div className="hidden md:flex w-4 h-4 rounded-full bg-primary relative z-10 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-50"></div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-16">
            <motion.h2 initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} viewport={{
            once: true
          }} className="text-3xl lg:text-5xl font-bold">
              Powerful <span className="text-gradient">Features</span>
            </motion.h2>
            <motion.p initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} viewport={{
            once: true
          }} className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to transform civic engagement and drive community change
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            icon: Shield,
            title: "Real-Time Transparency",
            description: "Track every report from submission to resolution with complete visibility"
          }, {
            icon: Globe,
            title: "Multi-Platform Access",
            description: "Access from any device, anywhere, ensuring continuous civic engagement"
          }, {
            icon: Target,
            title: "Smart Assignment",
            description: "AI-powered routing ensures reports reach the right authorities instantly"
          }, {
            icon: Award,
            title: "Analytics Dashboard",
            description: "Comprehensive insights into community issues and resolution patterns"
          }, {
            icon: Users,
            title: "Community Building",
            description: "Foster collaboration between citizens and government officials"
          }, {
            icon: Zap,
            title: "Instant Notifications",
            description: "Real-time updates keep everyone informed throughout the process"
          }].map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="saas-card p-6 hover:scale-105 transition-transform duration-300 rounded-xl">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-24 saas-section">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-16">
            <motion.h2 initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} viewport={{
            once: true
          }} className="text-3xl lg:text-5xl font-bold">
              Success <span className="text-gradient">Stories</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            quote: "FixTheMess transformed how our city handles citizen reports. Response times improved by 300%.",
            author: "Sarah Chen",
            role: "City Administrator",
            rating: 5
          }, {
            quote: "The transparency and real-time tracking have rebuilt trust between our community and local government.",
            author: "Michael Rodriguez",
            role: "Community Leader",
            rating: 5
          }, {
            quote: "Finally, a platform that makes civic engagement simple and effective for everyone involved.",
            author: "Dr. Emma Thompson",
            role: "Public Policy Expert",
            rating: 5
          }].map((testimonial, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.2
          }} viewport={{
            once: true
          }}>
                <Card className="saas-card h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex space-x-1">
                      {Array.from({
                    length: testimonial.rating
                  }).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                    </div>
                    <blockquote className="text-muted-foreground italic">"{testimonial.quote}"</blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Ready to Transform Your <span className="text-gradient">Community?</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of communities already making real change happen
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Start your free trial
              </Button>
              <Button variant="outline" size="lg" onClick={() => scrollToSection('features')} className="px-8 py-6 text-lg border-border/50">
                More about our features <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground space-y-4">
            <p>&copy; 2024 FixTheMess. All rights reserved.</p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span>Built by</span>
              <span className="font-semibold text-primary">Chirag Shetty</span>
              <span>•</span>
              <a 
                href="https://instagram.com/ichiragshetty" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                @ichiragshetty
              </a>
              <span>•</span>
              <a 
                href="https://github.com/chiragshettybp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Join;