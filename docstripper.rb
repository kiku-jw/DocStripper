# Homebrew formula for DocStripper
# To install: brew install --build-from-source docstripper.rb
# Or add this tap first: brew tap KikuAI-Lab/docstripper

class Docstripper < Formula
  desc "AI-powered batch document cleaner - Remove noise from text documents automatically"
  homepage "https://github.com/KikuAI-Lab/DocStripper"
  url "https://github.com/KikuAI-Lab/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
  version "2.1.0"
  sha256 "4b0a688c530ca596b9dba7d6494adf06011e287d20fe9e16d4b06876d8fdb273"
  license "MIT"

  depends_on "python@3.9"

  def install
    # Install the tool as a Python script
    bin.install "tool.py" => "docstripper"
    # Make it executable
    chmod 0755, bin/"docstripper"
  end

  test do
    # Run self-test
    system "#{bin}/docstripper", "--help"
    system "python3", "#{Formula["python@3.9"].opt_bin}/python3", "-c", "import sys; sys.path.insert(0, '#{share}/docstripper'); from tool import DocStripper; print('OK')" if File.exist?("#{share}/docstripper/tool.py")
  end
end
